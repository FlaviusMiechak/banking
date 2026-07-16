import Stripe from 'stripe';

const stripe =new Stripe('process.env.STRIPE_SECRET_KEY!', {
  apiVersion: '2026-05-27.dahlia', // Use the latest API version
});

async function activateInactiveCards() {
  try {
    // Get all cards with status 'inactive' or 'pending'
    const cards = await stripe.issuing.cards.list({
      limit: 100,
      status: 'inactive', // Change to 'pending' if you want to activate pending cards
    });
    
    console.log(`🔍 Found ${cards.data.length} inactive cards to activate...`);
    
    let activatedCount = 0;
    let failedCount = 0;
    
    for (const card of cards.data) {
      try {
        const updatedCard = await stripe.issuing.cards.update(card.id, {
          status: 'active',
        });
        
        console.log(`✅ Activated: ${card.id} (${card.last4})`);
        activatedCount++;
      } catch (error) {
        console.error(`❌ Failed to activate ${card.id}:`, error.message);
        failedCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Activated: ${activatedCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

activateInactiveCards();