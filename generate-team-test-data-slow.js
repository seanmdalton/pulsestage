#!/usr/bin/env node

const API_BASE = 'http://localhost:3000';

// Smaller, focused test data for each team
const teamQuestions = {
  'general': [
    'What is our company mission and vision?',
    'When are the next company all-hands meetings?',
    'What are the office hours and holiday schedule?',
    'How do I submit expense reports?',
    'What is our policy on remote work flexibility?'
  ],
  'engineering': [
    'What is our code review process and standards?',
    'How do we handle technical debt in our codebase?',
    'What are the deployment procedures for production?',
    'Can we upgrade to the latest version of our framework?',
    'What is our policy on open source contributions?'
  ],
  'product': [
    'What features are planned for the next quarter?',
    'How do we prioritize feature requests from customers?',
    'What is our product roadmap for this year?',
    'How do we gather and analyze user feedback?',
    'What metrics do we use to measure product success?'
  ],
  'people': [
    'What professional development opportunities are available?',
    'How does the promotion process work?',
    'What are the benefits and compensation packages?',
    'How do we handle workplace conflicts?',
    'What is our diversity and inclusion strategy?'
  ]
};

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Create a question
async function createQuestion(body, teamId) {
  return apiCall('/questions', 'POST', { body, teamId });
}

// Generate upvotes for a question (with delay to respect rate limits)
async function addUpvotes(questionId, count) {
  for (let i = 0; i < count; i++) {
    try {
      await apiCall(`/questions/${questionId}/upvote`, 'POST');
      // Wait 6 seconds between upvotes to respect rate limiting (10 per minute)
      await new Promise(resolve => setTimeout(resolve, 6500));
    } catch (error) {
      if (error.message.includes('429')) {
        console.log(`    ⏳ Rate limited, waiting 30 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        i--; // Retry this upvote
      } else {
        console.error(`    ❌ Failed to upvote: ${error.message}`);
      }
    }
  }
}

async function generateTeamData() {
  console.log('🌱 Generating historical test data for all teams (slow mode)...\n');
  
  // Get all teams
  const teams = await apiCall('/teams');
  console.log(`Found ${teams.length} teams:`, teams.map(t => t.name).join(', '));
  
  for (const team of teams) {
    console.log(`\n📋 Generating data for ${team.name} team...`);
    
    const questions = teamQuestions[team.slug] || [];
    
    if (questions.length === 0) {
      console.log(`  ⚠️  No test data defined for ${team.slug}, skipping...`);
      continue;
    }
    
    // Create questions for this team
    for (let i = 0; i < questions.length; i++) {
      const questionBody = questions[i];
      const upvoteCount = Math.floor(Math.random() * 5) + 1; // 1-5 upvotes to be faster
      
      try {
        // Create question
        const question = await createQuestion(questionBody, team.id);
        console.log(`  ✅ Created question: "${questionBody.substring(0, 50)}..."`);
        
        // Wait 6 seconds to respect rate limiting (10 per minute)
        await new Promise(resolve => setTimeout(resolve, 6500));
        
        // Add upvotes
        console.log(`  👍 Adding ${upvoteCount} upvotes...`);
        await addUpvotes(question.id, upvoteCount);
        
      } catch (error) {
        if (error.message.includes('429')) {
          console.log(`  ⏳ Rate limited, waiting 30 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 30000));
          i--; // Retry this question
        } else {
          console.error(`  ❌ Failed to create question: ${error.message}`);
        }
      }
    }
  }
  
  // Also create some questions without team assignment (for "All Teams" view)
  console.log('\n🌐 Creating general questions (no team assignment)...');
  const generalQuestions = [
    'What is the company\'s stance on artificial intelligence?',
    'How can we improve cross-team collaboration?',
    'What are the plans for office expansion?'
  ];
  
  for (const questionBody of generalQuestions) {
    try {
      const question = await createQuestion(questionBody, null); // No team assignment
      console.log(`  ✅ Created general question: "${questionBody.substring(0, 50)}..."`);
      
      // Wait and add upvotes
      await new Promise(resolve => setTimeout(resolve, 6500));
      const upvoteCount = Math.floor(Math.random() * 3) + 1;
      console.log(`  👍 Adding ${upvoteCount} upvotes...`);
      await addUpvotes(question.id, upvoteCount);
      
    } catch (error) {
      if (error.message.includes('429')) {
        console.log(`  ⏳ Rate limited, waiting 30 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      } else {
        console.error(`  ❌ Failed to create general question: ${error.message}`);
      }
    }
  }
  
  console.log('\n🎉 Test data generation completed!');
  console.log('\n📊 Summary:');
  console.log(`  • Generated questions for ${teams.length} teams`);
  console.log(`  • Each team has 5 questions with 1-5 upvotes`);
  console.log(`  • Added 3 general questions`);
  console.log('\n🔍 You can now test:');
  console.log('  • Team filtering on all pages');
  console.log('  • Search functionality within teams');
  console.log('  • Question modals and upvoting');
  console.log('  • Team selector dropdown with counts');
}

// Run the script
generateTeamData().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
