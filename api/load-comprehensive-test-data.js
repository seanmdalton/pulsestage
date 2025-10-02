#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';
const ADMIN_KEY = 'dev-admin-key-change-me';

// Comprehensive question data organized by team
const testData = {
  engineering: {
    name: 'Engineering',
    slug: 'engineering',
    description: 'Technical and development questions',
    questions: [
      {
        body: "What is our code review process and standards?",
        upvotes: 12,
        answered: true,
        answer: "We follow a structured code review process. All changes must be reviewed by at least one senior engineer before merging. We use automated tools for linting and testing, and focus on code quality, maintainability, and adherence to our coding standards."
      },
      {
        body: "How do we handle technical debt in our codebase?",
        upvotes: 15,
        answered: true,
        answer: "We track technical debt through our project management tools and allocate 20% of each sprint to addressing it. We prioritize based on impact and maintain a technical debt backlog that's reviewed quarterly."
      },
      {
        body: "What are the deployment procedures for production?",
        upvotes: 8,
        answered: false
      },
      {
        body: "Can we upgrade to the latest version of our framework?",
        upvotes: 6,
        answered: true,
        answer: "Framework upgrades are planned quarterly. We evaluate new versions for security, performance, and compatibility. The next upgrade is scheduled for Q2 and will include performance improvements and new security features."
      },
      {
        body: "What is our policy on open source contributions?",
        upvotes: 10,
        answered: false
      },
      {
        body: "How do we handle security vulnerabilities?",
        upvotes: 14,
        answered: true,
        answer: "We have a security response team that addresses vulnerabilities within 24 hours of discovery. Critical issues are patched immediately, while medium/low priority issues are addressed in the next release cycle."
      },
      {
        body: "What testing strategies should we implement?",
        upvotes: 9,
        answered: false
      },
      {
        body: "Can we get additional development tools and licenses?",
        upvotes: 7,
        answered: true,
        answer: "We have a budget for development tools and regularly evaluate new options. Submit requests through the engineering manager with justification for how it will improve productivity."
      },
      {
        body: "What is our approach to microservices architecture?",
        upvotes: 11,
        answered: false
      },
      {
        body: "How do we handle database migrations safely?",
        upvotes: 13,
        answered: true,
        answer: "We use a blue-green deployment strategy for database changes. All migrations are tested in staging first, and we maintain rollback procedures. Critical migrations are performed during maintenance windows."
      },
      {
        body: "What are the coding standards for new projects?",
        upvotes: 5,
        answered: false
      },
      {
        body: "Can we implement automated testing in our CI/CD pipeline?",
        upvotes: 16,
        answered: true,
        answer: "Automated testing is already integrated into our CI/CD pipeline. We run unit tests, integration tests, and security scans on every commit. We're looking to expand coverage with end-to-end tests."
      },
      {
        body: "How do we handle API versioning and backwards compatibility?",
        upvotes: 8,
        answered: false
      },
      {
        body: "What is our strategy for monitoring and observability?",
        upvotes: 12,
        answered: true,
        answer: "We use a comprehensive monitoring stack including application metrics, infrastructure monitoring, and distributed tracing. Alerts are configured for critical thresholds and we have 24/7 on-call rotation."
      },
      {
        body: "How do we manage secrets and environment variables?",
        upvotes: 9,
        answered: false
      },
      {
        body: "What are the guidelines for third-party library usage?",
        upvotes: 6,
        answered: true,
        answer: "All third-party libraries must be approved by the security team and engineering lead. We prefer well-maintained libraries with active communities and good security track records."
      },
      {
        body: "How do we handle performance optimization?",
        upvotes: 7,
        answered: false
      },
      {
        body: "What is our approach to documentation and knowledge sharing?",
        upvotes: 4,
        answered: true,
        answer: "We maintain technical documentation in our wiki and use code comments for inline documentation. We also conduct regular tech talks and maintain an internal knowledge base."
      },
      {
        body: "Can we implement feature flags for gradual rollout?",
        upvotes: 10,
        answered: false
      },
      {
        body: "How do we handle cross-team technical dependencies?",
        upvotes: 8,
        answered: false
      },
      {
        body: "What are the best practices for error handling and logging?",
        upvotes: 6,
        answered: true,
        answer: "We use structured logging with consistent formats and log levels. Error handling follows the fail-fast principle with appropriate fallbacks. All errors are tracked and monitored."
      },
      {
        body: "How do we ensure code quality and maintainability?",
        upvotes: 11,
        answered: false
      }
    ]
  },
  product: {
    name: 'Product',
    slug: 'product',
    description: 'Product strategy and feature questions',
    questions: [
      {
        body: "What features are planned for the next quarter?",
        upvotes: 18,
        answered: true,
        answer: "Our Q2 roadmap includes user authentication improvements, mobile app enhancements, and new analytics dashboard. We'll be releasing a public roadmap soon for more transparency."
      },
      {
        body: "How do we prioritize feature requests from customers?",
        upvotes: 14,
        answered: false
      },
      {
        body: "What is our product roadmap for this year?",
        upvotes: 16,
        answered: true,
        answer: "Our annual roadmap focuses on user experience improvements, platform scalability, and new integrations. We're also investing heavily in AI-powered features and mobile-first design."
      },
      {
        body: "How do we gather and analyze user feedback?",
        upvotes: 9,
        answered: false
      },
      {
        body: "What metrics do we use to measure product success?",
        upvotes: 12,
        answered: true,
        answer: "We track user engagement, retention rates, feature adoption, and customer satisfaction scores. We also monitor business metrics like conversion rates and revenue per user."
      },
      {
        body: "Can we implement dark mode for our application?",
        upvotes: 20,
        answered: true,
        answer: "Dark mode is high on our priority list! We're currently in the design phase and plan to release it in Q2. It will include both system preference detection and manual toggle options."
      },
      {
        body: "What is our strategy for mobile app development?",
        upvotes: 15,
        answered: false
      },
      {
        body: "How do we handle feature flags and A/B testing?",
        upvotes: 8,
        answered: true,
        answer: "We use a feature flag system that allows us to gradually roll out features and conduct A/B tests. This helps us validate features with real users before full deployment."
      },
      {
        body: "What is our approach to user onboarding?",
        upvotes: 11,
        answered: false
      },
      {
        body: "How do we decide which features to deprecate?",
        upvotes: 6,
        answered: true,
        answer: "We deprecate features based on usage analytics, user feedback, and strategic alignment. We provide advance notice to users and migration paths when possible."
      },
      {
        body: "What is our competitive analysis process?",
        upvotes: 7,
        answered: false
      },
      {
        body: "How do we handle user research and usability testing?",
        upvotes: 10,
        answered: true,
        answer: "We conduct regular user interviews, usability tests, and surveys. Our research team works closely with design and engineering to ensure user needs are met."
      },
      {
        body: "What are the guidelines for product documentation?",
        upvotes: 4,
        answered: false
      },
      {
        body: "How do we manage product backlogs and sprint planning?",
        upvotes: 13,
        answered: true,
        answer: "We use agile methodologies with 2-week sprints. Our backlog is prioritized based on user impact, business value, and technical feasibility. Sprint planning involves the entire team."
      },
      {
        body: "What is our approach to internationalization and localization?",
        upvotes: 5,
        answered: false
      },
      {
        body: "How do we handle product analytics and data collection?",
        upvotes: 9,
        answered: true,
        answer: "We collect analytics data to understand user behavior and improve our product. All data collection follows privacy regulations and we provide users with control over their data."
      },
      {
        body: "What are the criteria for launching new features?",
        upvotes: 8,
        answered: false
      },
      {
        body: "How do we manage product partnerships and integrations?",
        upvotes: 6,
        answered: true,
        answer: "Partnerships are evaluated based on strategic value and user benefit. We prioritize integrations that enhance our core functionality and improve user experience."
      },
      {
        body: "What is our strategy for user retention and engagement?",
        upvotes: 17,
        answered: false
      },
      {
        body: "How do we handle product security and privacy requirements?",
        upvotes: 11,
        answered: true,
        answer: "Security and privacy are built into our product development process. We conduct regular security audits and ensure compliance with relevant regulations."
      },
      {
        body: "What are the processes for product discovery and validation?",
        upvotes: 7,
        answered: false
      },
      {
        body: "How do we coordinate product releases across teams?",
        upvotes: 9,
        answered: true,
        answer: "We use a coordinated release process with clear communication channels. Cross-team releases are planned well in advance with defined rollback procedures."
      }
    ]
  },
  people: {
    name: 'People',
    slug: 'people',
    description: 'HR, culture, and people-related questions',
    questions: [
      {
        body: "How do we handle workplace conflicts?",
        upvotes: 12,
        answered: true,
        answer: "We have a structured conflict resolution process that includes mediation and support from HR. We encourage open communication and provide training on conflict resolution skills."
      },
      {
        body: "What are the procedures for handling grievances?",
        upvotes: 8,
        answered: true,
        answer: "Grievances can be reported through multiple channels including direct manager, HR, or our anonymous reporting system. All grievances are investigated thoroughly and confidentially."
      },
      {
        body: "How does the promotion process work?",
        upvotes: 15,
        answered: false
      },
      {
        body: "What is our diversity and inclusion strategy?",
        upvotes: 13,
        answered: true,
        answer: "We're committed to building an inclusive workplace through bias training, diverse hiring practices, and employee resource groups. We regularly review our policies and practices for inclusivity."
      },
      {
        body: "What is our policy on flexible working arrangements?",
        upvotes: 19,
        answered: false
      },
      {
        body: "How do we support employee mental health and wellbeing?",
        upvotes: 16,
        answered: true,
        answer: "We offer mental health support through our EAP program, flexible work arrangements, and wellness initiatives. We also provide training for managers on supporting team mental health."
      },
      {
        body: "What are the guidelines for performance reviews?",
        upvotes: 10,
        answered: false
      },
      {
        body: "How do we handle remote work policies?",
        upvotes: 14,
        answered: true,
        answer: "We support hybrid and remote work arrangements. Our policy focuses on outcomes rather than hours worked, with clear guidelines for communication and collaboration."
      },
      {
        body: "What professional development opportunities are available?",
        upvotes: 11,
        answered: false
      },
      {
        body: "How do we ensure fair compensation and benefits?",
        upvotes: 17,
        answered: true,
        answer: "We conduct regular compensation reviews and benchmarking. Our benefits package is reviewed annually and includes health insurance, retirement plans, and professional development allowances."
      },
      {
        body: "What is our approach to team building and culture?",
        upvotes: 7,
        answered: false
      },
      {
        body: "How do we handle employee feedback and surveys?",
        upvotes: 9,
        answered: true,
        answer: "We conduct regular employee surveys and feedback sessions. All feedback is taken seriously and we follow up with action plans to address concerns and suggestions."
      },
      {
        body: "What are the policies for time off and vacation?",
        upvotes: 12,
        answered: false
      },
      {
        body: "How do we support career growth and advancement?",
        upvotes: 13,
        answered: true,
        answer: "We provide career development planning, mentorship programs, and opportunities for skill development. Each employee has regular career conversations with their manager."
      },
      {
        body: "What is our policy on workplace harassment and discrimination?",
        upvotes: 18,
        answered: false
      },
      {
        body: "How do we handle employee recognition and rewards?",
        upvotes: 8,
        answered: true,
        answer: "We have multiple recognition programs including peer recognition, manager awards, and company-wide achievements. We believe in recognizing both individual and team contributions."
      },
      {
        body: "What are the guidelines for internal communication?",
        upvotes: 6,
        answered: false
      },
      {
        body: "How do we ensure workplace safety and security?",
        upvotes: 10,
        answered: true,
        answer: "We maintain strict safety protocols and security measures. All employees receive safety training and we have emergency procedures in place for various scenarios."
      },
      {
        body: "What is our approach to onboarding new employees?",
        upvotes: 9,
        answered: false
      },
      {
        body: "How do we handle employee exits and offboarding?",
        upvotes: 5,
        answered: true,
        answer: "We have a structured offboarding process that includes knowledge transfer, equipment return, and exit interviews. We aim to maintain positive relationships with departing employees."
      },
      {
        body: "What are the policies for social media and external communications?",
        upvotes: 4,
        answered: false
      },
      {
        body: "How do we support work-life balance?",
        upvotes: 14,
        answered: true,
        answer: "We promote work-life balance through flexible schedules, remote work options, and policies that discourage after-hours communication. We also offer wellness programs and mental health support."
      }
    ]
  },
  general: {
    name: 'General',
    slug: 'general',
    description: 'General organizational questions',
    questions: [
      {
        body: "What is our company mission and vision?",
        upvotes: 22,
        answered: true,
        answer: "Our mission is to empower organizations through innovative technology solutions. Our vision is to be the leading platform that transforms how teams collaborate and communicate."
      },
      {
        body: "When are the next company all-hands meetings?",
        upvotes: 8,
        answered: false
      },
      {
        body: "What are the office hours and holiday schedule?",
        upvotes: 12,
        answered: true,
        answer: "Our office hours are 9 AM to 6 PM, Monday through Friday. We observe all federal holidays and have additional company holidays throughout the year. The full schedule is available in our employee handbook."
      },
      {
        body: "How do I submit expense reports?",
        upvotes: 15,
        answered: false
      },
      {
        body: "What is our policy on remote work flexibility?",
        upvotes: 19,
        answered: true,
        answer: "We offer flexible remote work arrangements. Employees can work from home up to 3 days per week, with full remote work available for certain roles. We focus on results and collaboration."
      },
      {
        body: "Can we get better coffee in the office kitchen?",
        upvotes: 25,
        answered: true,
        answer: "Great suggestion! We've upgraded our coffee machine and now offer premium coffee beans. We also have a variety of tea options and healthy snacks available."
      },
      {
        body: "What are the parking arrangements for the office?",
        upvotes: 6,
        answered: false
      },
      {
        body: "How do we handle company announcements and updates?",
        upvotes: 9,
        answered: true,
        answer: "We use multiple channels for announcements including email, Slack, and our internal portal. Important updates are also shared during team meetings and all-hands sessions."
      },
      {
        body: "What is the dress code policy?",
        upvotes: 7,
        answered: false
      },
      {
        body: "How do we celebrate company milestones and achievements?",
        upvotes: 11,
        answered: true,
        answer: "We celebrate milestones with company-wide events, team lunches, and recognition programs. We also share achievements in our internal newsletter and social media."
      },
      {
        body: "What are the procedures for reporting workplace issues?",
        upvotes: 13,
        answered: false
      },
      {
        body: "How do we handle company-wide communication during emergencies?",
        upvotes: 10,
        answered: true,
        answer: "We have an emergency communication system that can reach all employees via multiple channels including SMS, email, and our internal app. We conduct regular drills to ensure everyone knows the procedures."
      },
      {
        body: "What is our policy on bringing guests to the office?",
        upvotes: 4,
        answered: false
      },
      {
        body: "How do we support community involvement and volunteering?",
        upvotes: 8,
        answered: true,
        answer: "We encourage community involvement and offer paid volunteer time off. We also organize company-wide volunteer events and support employee-led community initiatives."
      },
      {
        body: "What are the guidelines for using company equipment?",
        upvotes: 5,
        answered: false
      },
      {
        body: "How do we handle company events and team building?",
        upvotes: 12,
        answered: true,
        answer: "We organize regular team building events, company outings, and social activities. These events are designed to build relationships and strengthen our company culture."
      },
      {
        body: "What is our policy on pets in the office?",
        upvotes: 16,
        answered: false
      },
      {
        body: "How do we support environmental sustainability?",
        upvotes: 9,
        answered: true,
        answer: "We're committed to sustainability through recycling programs, energy-efficient practices, and supporting green initiatives. We also offer incentives for employees who use sustainable transportation."
      },
      {
        body: "What are the procedures for office maintenance and repairs?",
        upvotes: 3,
        answered: false
      },
      {
        body: "How do we handle company swag and merchandise?",
        upvotes: 6,
        answered: true,
        answer: "We provide company swag to new employees and have regular merchandise updates. Employees can also request additional items through our internal portal."
      },
      {
        body: "What is our approach to company transparency?",
        upvotes: 14,
        answered: false
      },
      {
        body: "How do we support employee wellness and health programs?",
        upvotes: 11,
        answered: true,
        answer: "We offer comprehensive wellness programs including gym memberships, health screenings, mental health support, and wellness challenges. We believe healthy employees are more productive and engaged."
      }
    ]
  }
};

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  
  // Delete questions first (due to foreign key constraints)
  await prisma.question.deleteMany();
  
  // Delete teams
  await prisma.team.deleteMany();
  
  console.log('✅ Database cleared');
}

async function createTeams() {
  console.log('🏢 Creating teams...');
  
  for (const [key, teamData] of Object.entries(testData)) {
    const { questions, ...teamInfo } = teamData; // Remove questions from team data
    const team = await prisma.team.upsert({
      where: { slug: teamData.slug },
      update: teamInfo,
      create: teamInfo
    });
    console.log(`  ✅ Created team: ${team.name}`);
  }
}

async function loginAsAdmin() {
  console.log('🔐 Logging in as admin...');
  
  const response = await fetch(`${BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminKey: ADMIN_KEY })
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }
  
  const cookies = response.headers.get('set-cookie');
  console.log('✅ Admin login successful');
  return cookies;
}

async function createQuestion(questionData, teamId, cookies) {
  const response = await fetch(`${BASE_URL}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({
      body: questionData.body,
      teamId: teamId
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create question: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

async function addUpvotes(questionId, upvoteCount, cookies) {
  for (let i = 0; i < upvoteCount; i++) {
    const response = await fetch(`${BASE_URL}/questions/${questionId}/upvote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add upvote: ${response.status} ${response.statusText}`);
    }
  }
}

async function answerQuestion(questionId, answer, cookies) {
  const response = await fetch(`${BASE_URL}/questions/${questionId}/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({ response: answer })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to answer question: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

async function updateQuestionDate(questionId, daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  
  await prisma.question.update({
    where: { id: questionId },
    data: {
      createdAt: date,
      updatedAt: date,
      respondedAt: date // For answered questions
    }
  });
}

async function loadTestData() {
  try {
    console.log('🌱 Loading comprehensive test data...');
    
    // Clear existing data
    await clearDatabase();
    
    // Create teams
    await createTeams();
    
    // Login as admin
    const cookies = await loginAsAdmin();
    
    // Get teams from database
    const teams = await prisma.team.findMany();
    const teamMap = {};
    teams.forEach(team => {
      teamMap[team.slug] = team;
    });
    
    // Create questions for each team
    for (const [key, teamData] of Object.entries(testData)) {
      console.log(`📋 Creating questions for ${teamData.name} team...`);
      const team = teamMap[teamData.slug];
      
      for (let i = 0; i < teamData.questions.length; i++) {
        const questionData = teamData.questions[i];
        
        try {
          console.log(`  📝 Creating question ${i + 1}/${teamData.questions.length}: "${questionData.body.substring(0, 50)}..."`);
          
          // Create question
          const question = await createQuestion(questionData, team.id, cookies);
          
          // Add upvotes
          if (questionData.upvotes > 0) {
            console.log(`    👍 Adding ${questionData.upvotes} upvotes...`);
            await addUpvotes(question.id, questionData.upvotes, cookies);
          }
          
          // Answer question if specified
          if (questionData.answered && questionData.answer) {
            console.log(`    💬 Adding answer...`);
            await answerQuestion(question.id, questionData.answer, cookies);
          }
          
          // Set question date (spread across different weeks)
          const daysAgo = Math.floor(Math.random() * 35); // 0-35 days ago
          await updateQuestionDate(question.id, daysAgo);
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.log(`    ❌ Failed: ${error.message}`);
        }
      }
    }
    
    // Create some questions without team assignment (general questions)
    console.log('🌐 Creating general questions (no team assignment)...');
    const generalQuestions = [
      "What is the company's stance on artificial intelligence and automation?",
      "How can we improve cross-team collaboration and communication?",
      "What are the plans for office expansion or relocation?",
      "Can we get a company-wide communication platform for better coordination?",
      "What is our environmental sustainability and corporate responsibility policy?",
      "How do we handle customer feedback and feature requests?",
      "What are the guidelines for external partnerships and vendor relationships?"
    ];
    
    for (let i = 0; i < generalQuestions.length; i++) {
      try {
        console.log(`  📝 Creating general question ${i + 1}/${generalQuestions.length}: "${generalQuestions[i].substring(0, 50)}..."`);
        
        const question = await createQuestion({ body: generalQuestions[i] }, null, cookies);
        
        // Add random upvotes
        const upvotes = Math.floor(Math.random() * 15) + 1;
        await addUpvotes(question.id, upvotes, cookies);
        
        // Set random date
        const daysAgo = Math.floor(Math.random() * 35);
        await updateQuestionDate(question.id, daysAgo);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`    ❌ Failed: ${error.message}`);
      }
    }
    
    console.log('🎉 Comprehensive test data loaded successfully!');
    console.log('📊 Final Summary:');
    
    // Get final counts
    const finalTeams = await prisma.team.findMany({
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });
    
    finalTeams.forEach(team => {
      console.log(`  • ${team.name}: ${team._count.questions} questions`);
    });
    
    const totalQuestions = await prisma.question.count();
    const answeredQuestions = await prisma.question.count({
      where: { status: 'ANSWERED' }
    });
    
    console.log(`  • Total questions: ${totalQuestions}`);
    console.log(`  • Answered questions: ${answeredQuestions}`);
    console.log(`  • Open questions: ${totalQuestions - answeredQuestions}`);
    
    console.log('');
    console.log('🔍 You can now test:');
    console.log('  • Team filtering on all pages');
    console.log('  • Search functionality within teams');
    console.log('  • Weekly grouping for answered questions');
    console.log('  • Question modals and upvoting');
    console.log('  • Team selector dropdown with accurate counts');
    console.log('  • Admin panel with team management');
    console.log('  • Questions spanning multiple weeks with realistic dates');
    
  } catch (error) {
    console.error('❌ Error loading test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

loadTestData();
