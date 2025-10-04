import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { testPrisma } from "./test/setup.js";

const app = createApp(testPrisma);

describe("API Tests", () => {
  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true, service: "ama-api" });
    });
  });

  describe("POST /questions", () => {
    it("should create a question with valid data", async () => {
      const response = await request(app)
        .post("/questions")
        .send({ body: "What is your favorite color?" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.body).toBe("What is your favorite color?");
      expect(response.body.upvotes).toBe(0);
      expect(response.body.status).toBe("OPEN");
    });

    it("should reject question with body too short", async () => {
      const response = await request(app)
        .post("/questions")
        .send({ body: "Hi" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject question with body too long", async () => {
      const response = await request(app)
        .post("/questions")
        .send({ body: "a".repeat(2001) });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject question with missing body", async () => {
      const response = await request(app)
        .post("/questions")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /questions", () => {
    beforeEach(async () => {
      // Create test questions
      await testPrisma.question.create({
        data: { body: "Open question 1", upvotes: 5, status: "OPEN", tenantId: "default-tenant-id" }
      });
      await testPrisma.question.create({
        data: { body: "Open question 2", upvotes: 10, status: "OPEN", tenantId: "default-tenant-id" }
      });
      await testPrisma.question.create({
        data: {
          body: "Answered question",
          status: "ANSWERED",
          responseText: "The answer",
          respondedAt: new Date(),
          tenantId: "default-tenant-id"
        }
      });
    });

    it("should return open questions by default", async () => {
      const response = await request(app).get("/questions");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].status).toBe("OPEN");
      expect(response.body[1].status).toBe("OPEN");
    });

    it("should return open questions when status=open", async () => {
      const response = await request(app).get("/questions?status=open");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.every((q: any) => q.status === "OPEN")).toBe(true);
    });

    it("should return answered questions when status=answered", async () => {
      const response = await request(app).get("/questions?status=answered");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe("ANSWERED");
      expect(response.body[0].responseText).toBe("The answer");
    });

    it("should return questions sorted by upvotes desc", async () => {
      const response = await request(app).get("/questions?status=open");

      expect(response.status).toBe(200);
      expect(response.body[0].upvotes).toBe(10);
      expect(response.body[1].upvotes).toBe(5);
    });
  });

  describe("POST /questions/:id/upvote", () => {
    it("should increment upvotes for existing question", async () => {
      const question = await testPrisma.question.create({
        data: { body: "Test question", upvotes: 0, tenantId: "default-tenant-id" }
      });

      const response = await request(app)
        .post(`/questions/${question.id}/upvote`);

      expect(response.status).toBe(200);
      expect(response.body.upvotes).toBe(1);
    });

    it("should return 404 for non-existent question", async () => {
      const response = await request(app)
        .post("/questions/non-existent-id/upvote");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /questions/:id/respond", () => {
    let question: any;
    let adminUser: any;
    let testTeam: any;

    beforeEach(async () => {
      // Create a test team
      testTeam = await testPrisma.team.create({
        data: {
          name: "Test Team",
          slug: "test-team",
          tenantId: "default-tenant-id"
        }
      });

      // Create an admin user
      adminUser = await testPrisma.user.create({
        data: {
          email: "admin@test.com",
          name: "Admin User",
          ssoId: "admin@test.com",
          tenantId: "default-tenant-id"
        }
      });

      // Create team membership with admin role
      await testPrisma.teamMembership.create({
        data: {
          userId: adminUser.id,
          teamId: testTeam.id,
          role: "admin"
        }
      });

      question = await testPrisma.question.create({
        data: { body: "Test question", tenantId: "default-tenant-id" }
      });
    });

    it("should respond to question with valid admin role", async () => {
      const response = await request(app)
        .post(`/questions/${question.id}/respond`)
        .set('x-mock-sso-user', adminUser.email)
        .set('x-tenant-id', 'default')
        .send({ response: "This is my answer" });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ANSWERED");
      expect(response.body.responseText).toBe("This is my answer");
      expect(response.body.respondedAt).toBeTruthy();
    });

    it("should reject without authentication", async () => {
      const response = await request(app)
        .post(`/questions/${question.id}/respond`)
        .set('x-tenant-id', 'default')
        .send({ response: "This is my answer" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject with missing response", async () => {
      const response = await request(app)
        .post(`/questions/${question.id}/respond`)
        .set('x-mock-sso-user', adminUser.email)
        .set('x-tenant-id', 'default')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject with response too short", async () => {
      const response = await request(app)
        .post(`/questions/${question.id}/respond`)
        .set('x-mock-sso-user', adminUser.email)
        .set('x-tenant-id', 'default')
        .send({ response: "" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should return 404 for non-existent question", async () => {
      const response = await request(app)
        .post("/questions/non-existent-id/respond")
        .set('x-mock-sso-user', adminUser.email)
        .set('x-tenant-id', 'default')
        .send({ response: "This is my answer" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });
  });
});

