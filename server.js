import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-05-27.dahlia',
});

async function diagnoseAndActivateCards() {
  try {
    // 1. Get inactive cards
    const cards = await stripe.issuing.cards.list({
      limit: 100,
      status: 'inactive',
    });
    
    console.log(`🔍 Found ${cards.data.length} inactive cards\n`);
    
    let canActivate = 0;
    let needResolution = 0;
    
    for (const card of cards.data) {
      try {
        // Get cardholder
        const cardholder = await stripe.issuing.cardholders.retrieve(card.cardholder);
        
        console.log(`📝 Card: ${card.id} (${card.last4})`);
        console.log(`   Cardholder: ${cardholder.id} (${cardholder.name || 'No name'})`);
        console.log(`   Cardholder Status: ${cardholder.status}`);
        
        // Check requirements
        const hasErrors = cardholder.requirements?.errors?.length > 0;
        
        if (hasErrors) {
          console.log(`   ⚠️  REQUIREMENTS NEEDED:`);
          cardholder.requirements.errors.forEach(err => {
            console.log(`      - ${err.reason}: ${err.message}`);
          });
          console.log(`   🔗 Fix at: https://dashboard.stripe.com/test/issuing/cardholders/${cardholder.id}`);
          needResolution++;
        } else if (cardholder.status === 'active') {
          // Try to activate
          await stripe.issuing.cards.update(card.id, {
            status: 'active',
          });
          console.log(`   ✅ ACTIVATED SUCCESSFULLY!`);
          canActivate++;
        } else {
          console.log(`   ⏳ Cardholder status: ${cardholder.status} - cannot activate yet`);
        }
        
        console.log(``);
        
      } catch (error) {
        console.log(`❌ Error with card ${card.id}: ${error.message}\n`);
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   ✅ Cards that can be activated: ${canActivate}`);
    console.log(`   ⚠️  Cardholders needing requirements: ${needResolution}`);
    console.log(`   📋 Check Stripe Dashboard to resolve requirements`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

diagnoseAndActivateCards();