import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export const dynamic = 'force-dynamic'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
  apiVersion: "2026-05-27.dahlia" 
});

export async function POST(req: Request) {
  try {
    const { userId, email, pin, phone, country, state, tax, city, line1, postalCode } = await req.json();
    const supabase = createClient();
    const adminSupabase = createAdminClient();

    console.log("Creating card for user:", userId);

    // 1. Get or create user
    let userData = null;
    
    const { data: existingUser } = await adminSupabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', userId)
      .maybeSingle();

    if (existingUser) {
      userData = existingUser;
      console.log("User found:", userData);
    } else {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        console.error("Auth error:", authError);
        return NextResponse.json(
          { success: false, error: "Not authenticated" },
          { status: 401 }
        );
      }

      const firstName = authUser.user_metadata?.first_name || 
                       authUser.user_metadata?.name || 
                       'User';
      const lastName = authUser.user_metadata?.last_name || '';

      const { data: newUser, error: createError } = await adminSupabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          first_name: firstName,
          last_name: lastName,
        })
        .select('first_name, last_name')
        .single();

      if (createError) {
        console.error("Error creating user:", createError);
        userData = { first_name: firstName, last_name: lastName };
      } else {
        userData = newUser;
      }
      console.log("User created/found:", userData);
    }

    if (!userData) {
      userData = { first_name: 'User', last_name: '' };
    }

    // 2. Get or create bank account for the user
    let bankId = userId; // Default to userId if no bank account exists
    
    const { data: bankAccount, error: bankError } = await adminSupabase
      .from('bank_accounts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (bankAccount) {
      bankId = bankAccount.id;
      console.log("Bank account found:", bankId);
    } else {
      console.log("No bank account found, creating one...");
      // Create a bank account for the user
      const { data: newBank, error: createBankError } = await adminSupabase
        .from('bank_accounts')
        .insert({
          user_id: userId,
          account_name: `${userData.first_name} ${userData.last_name}`.trim() || 'Default Account',
          account_type: 'checking',
          currency: 'usd',
          balance: 0
        })
        .select('id')
        .single();

      if (createBankError) {
        console.error("Error creating bank account:", createBankError);
        // Fallback: use userId as bank_id
        bankId = userId;
      } else if (newBank) {
        bankId = newBank.id;
        console.log("Bank account created:", bankId);
      }
    }

    // 3. Generate cardholder name
    const generateCardholderName = () => {
      if (userData?.first_name) {
        const fullName = `${userData.first_name} ${userData.last_name || ''}`.trim();
        if (fullName.length > 0) {
          return fullName.substring(0, 24);
        }
        return userData.first_name.substring(0, 24);
      }
      
      const emailName = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      if (emailName.length > 0) {
        return emailName.substring(0, 24);
      }
      
      return `user_${userId.substring(0, 10)}`;
    };

    const cardholderName = generateCardholderName();
    console.log(`Cardholder name: "${cardholderName}"`);

    // 4. Prepare address
    const address: Stripe.Issuing.CardholderCreateParams.Billing = {
      address: {
        country,
        city,
        line1,
        postal_code: postalCode,
      }
    };

    // Add state for US addresses
    if (country === 'US') {
      const cleanState = state?.toUpperCase().trim().substring(0, 2);
      
      const validStates = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
      ];
      
      if (cleanState && validStates.includes(cleanState)) {
        address.address.state = cleanState;
        console.log(`Using state: ${cleanState}`);
      } else {
        console.warn(`Invalid or missing state for US address: ${state}`);
        address.address.state = 'CA';
        console.log(`Using default state: CA`);
      }
    }

    // 5. Create Stripe cardholder
    const cardholderData: Stripe.Issuing.CardholderCreateParams = {
      name: cardholderName,
      email: email,
      phone_number: phone,
      billing: address,
      metadata: { 
        user_id: userId,
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
      }
    };

    // Add individual verification if tax/document is provided
    if (tax && tax.length > 0 && tax !== '092547500') {
      cardholderData.individual = {
        verification: {
          document: {
            front: tax
          }
        }
      };
    }

    console.log("Creating cardholder...");
    const cardholder = await stripe.issuing.cardholders.create(cardholderData);
    console.log("Cardholder created:", cardholder.id);

    // 6. Create Stripe card
    const card = await stripe.issuing.cards.create({
      cardholder: cardholder.id,
      currency: "usd",
      type: "virtual"
    });

    console.log("Card created:", card.id);

    // 7. Store in Supabase with all columns
    const billingAddress = {
      city,
      country,
      line1,
      postal_code: postalCode,
      state: address.address.state || state || null
    };

    const cardFunding = (card as any).funding || null;

    const { error: insertError } = await adminSupabase
      .from("cards")
      .insert({
        bank_id: bankId,
        user_id: userId,
        stripe_card_id: card.id,
        stripe_cardholder_id: cardholder.id,
        stripe_customer_id: cardholder.id,
        brand: card.brand,
        last4: card.last4,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        card_type: card.type,
        funding: cardFunding,
        currency: card.currency,
        status: card.status,
        spending_limit: 0,
        billing_address: billingAddress,
        address_state: address.address.state || state || null,
        address_country: country,
        address_city: city,
        address_line1: line1,
        address_postal: postalCode,
        cardholder_name: cardholderName
      });

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      
      // Try with minimal required fields if full insert fails
      console.log("Trying minimal insert...");
      const { error: minimalError } = await adminSupabase
        .from("cards")
        .insert({
          bank_id: bankId,
          user_id: userId,
          stripe_card_id: card.id,
          stripe_cardholder_id: cardholder.id,
          brand: card.brand,
          last4: card.last4,
          exp_month: card.exp_month,
          exp_year: card.exp_year,
          card_type: card.type,
          status: card.status,
          currency: card.currency
        });

      if (minimalError) {
        console.error("Minimal insert also failed:", minimalError);
        // Still return success since Stripe creation worked
        return NextResponse.json({ 
          success: true, 
          cardId: card.id,
          cardholderId: cardholder.id,
          warning: "Card created in Stripe but database save failed",
          error: insertError.message
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      cardId: card.id,
      cardholderId: cardholder.id,
      cardholderName: cardholderName,
      bankId: bankId
    });
  } catch (error) {
    console.error("Error creating card:", error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          type: error.type 
        },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create card" },
      { status: 500 }
    );
  }
}