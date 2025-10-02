// Script to generate historical test data for weekly grouping
import { execSync } from 'child_process';

const API_URL = 'http://localhost:3000';
const ADMIN_KEY = 'dev-admin-key-change-me';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Historical questions with specific dates for testing weekly grouping
const historicalQuestions = [
  // This week
  {
    body: "What are our plans for the upcoming product launch?",
    upvotes: 15,
    daysAgo: 2,
    answer: "We're planning a phased rollout starting next month with beta testing for key customers first."
  },
  {
    body: "Can we improve our remote work policies?",
    upvotes: 8,
    daysAgo: 1,
    answer: "We're currently reviewing our policies based on team feedback and will announce updates soon."
  },

  // Last week
  {
    body: "Why was the quarterly meeting cancelled?",
    upvotes: 12,
    daysAgo: 8,
    answer: "The meeting was postponed to allow more time for department reports. It's rescheduled for next Friday."
  },
  {
    body: "What's our strategy for the new market expansion?",
    upvotes: 20,
    daysAgo: 10,
    answer: "We're focusing on three key regions with dedicated teams for each. Full details will be shared in the next all-hands."
  },
  {
    body: "Can we get better coffee in the office?",
    upvotes: 35,
    daysAgo: 9,
    answer: "Great news! We've partnered with a local roastery and new coffee machines are being installed this week."
  },

  // 2 weeks ago
  {
    body: "How is our company performing financially this quarter?",
    upvotes: 25,
    daysAgo: 14,
    answer: "We're exceeding our revenue targets by 12% and have strong growth in all key metrics. Detailed report coming soon."
  },
  {
    body: "What training opportunities are available for career development?",
    upvotes: 18,
    daysAgo: 16,
    answer: "We offer online courses, conference attendance, and mentorship programs. Check the learning portal for full details."
  },

  // 3 weeks ago
  {
    body: "Are we hiring more engineers for the mobile team?",
    upvotes: 22,
    daysAgo: 21,
    answer: "Yes, we're actively recruiting 5 mobile developers. If you know great candidates, please refer them!"
  },
  {
    body: "What's the timeline for the new office renovation?",
    upvotes: 14,
    daysAgo: 19,
    answer: "Phase 1 starts next month and will be completed by end of quarter. We'll work in phases to minimize disruption."
  },

  // Last month
  {
    body: "How can we improve work-life balance across teams?",
    upvotes: 30,
    daysAgo: 28,
    answer: "We're implementing flexible hours, mental health days, and exploring 4-day work week pilots for interested teams."
  },
  {
    body: "What's our sustainability initiative progress?",
    upvotes: 16,
    daysAgo: 32,
    answer: "We've reduced carbon footprint by 25% this year through renewable energy and remote work policies. More updates coming."
  },

  // 2 months ago
  {
    body: "Why did we change our benefits provider?",
    upvotes: 28,
    daysAgo: 45,
    answer: "The new provider offers better coverage, more options, and 20% cost savings. Transition completed smoothly with no gaps."
  },
  {
    body: "What's the status of the customer portal redesign?",
    upvotes: 19,
    daysAgo: 52,
    answer: "Beta version is live with select customers. Feedback is very positive. Full launch planned for next quarter."
  },

  // 3 months ago (different year to test year handling)
  {
    body: "How are we addressing the supply chain challenges?",
    upvotes: 33,
    daysAgo: 85,
    answer: "We've diversified suppliers and built strategic inventory buffers. Lead times have improved by 40% since implementation."
  },
  {
    body: "What's our plan for international expansion?",
    upvotes: 27,
    daysAgo: 92,
    answer: "We're entering European markets first, starting with Germany and UK. Local partnerships are being finalized."
  }
];

async function createQuestionWithDate(questionData) {
  try {
    // Create the question using curl
    const createCmd = `curl -s -X POST -H "Content-Type: application/json" -d '${JSON.stringify({ body: questionData.body })}' ${API_URL}/questions`;
    const questionResult = execSync(createCmd, { encoding: 'utf8' });
    const question = JSON.parse(questionResult);
    
    console.log(`✅ Created question: "${questionData.body.substring(0, 50)}..."`);

    // Add upvotes (just a few to avoid rate limits)
    const upvotesToAdd = Math.min(questionData.upvotes, 5);
    for (let i = 0; i < upvotesToAdd; i++) {
      try {
        execSync(`curl -s -X POST ${API_URL}/questions/${question.id}/upvote`, { encoding: 'utf8' });
        await delay(100);
      } catch (error) {
        console.log(`⚠️  Upvote failed (rate limit)`);
        break;
      }
    }

    // Add answer using admin key
    const respondCmd = `curl -s -X POST -H "Content-Type: application/json" -H "x-admin-key: ${ADMIN_KEY}" -d '${JSON.stringify({ response: questionData.answer })}' ${API_URL}/questions/${question.id}/respond`;
    execSync(respondCmd, { encoding: 'utf8' });

    console.log(`📅 Question answered (${questionData.daysAgo} days ago simulation)`);
    
    return question;
  } catch (error) {
    console.error(`❌ Error creating question: ${error.message}`);
    return null;
  }
}

async function generateHistoricalData() {
  console.log('🕰️  Generating historical test data for weekly grouping...');
  console.log(`📊 Creating ${historicalQuestions.length} questions across different time periods\n`);

  for (let i = 0; i < historicalQuestions.length; i++) {
    const questionData = historicalQuestions[i];
    console.log(`[${i + 1}/${historicalQuestions.length}] Processing question from ${questionData.daysAgo} days ago...`);
    
    await createQuestionWithDate(questionData);
    console.log(''); // Empty line for readability
    
    await delay(1000); // Delay between questions to avoid rate limits
  }

  console.log('🎉 Historical data generation complete!');
  console.log('\n📋 Summary:');
  console.log(`• ${historicalQuestions.length} answered questions created`);
  console.log(`• Spanning ${Math.max(...historicalQuestions.map(q => q.daysAgo))} days of history`);
  console.log(`• Questions distributed across multiple weeks for testing`);
  console.log('\n🔍 Note: Dates are simulated in the creation process.');
  console.log('The actual database dates will need manual adjustment for true historical testing.');
  console.log('\n✨ Check the answered questions page to see weekly grouping in action!');
}

generateHistoricalData().catch(console.error);
