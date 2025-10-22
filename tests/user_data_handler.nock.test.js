const UserDataHandler = require("../src/data_handlers/user_data_handler");
const nock = require("nock");

describe("UserDataHandler with NOCK", () => {
  let userDataHandler;

  beforeEach(() => {
    userDataHandler = new UserDataHandler();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe("loadUsers", () => {
    it("should load users successfully", async () => {
      const mockUsers = [
        { id: 1, name: "John", email: "john@test.com" },
        { id: 2, name: "Jane", email: "jane@test.com" },
      ];

      nock("http://localhost:3000").get("/users").reply(200, mockUsers);

      await userDataHandler.loadUsers();

      expect(userDataHandler.users).toEqual(mockUsers);
    });

    it("should throw error when API call fails", async () => {
      nock("http://localhost:3000")
        .get("/users")
        .replyWithError("Network error");

      await expect(userDataHandler.loadUsers()).rejects.toThrow(
        "Failed to load users data: Error: Network error"
      );
    });

    it("should handle 404 error", async () => {
      nock("http://localhost:3000")
        .get("/users")
        .reply(404, { error: "Not found" });

      await expect(userDataHandler.loadUsers()).rejects.toThrow(
        "Failed to load users data: Error: Request failed with status code 404"
      );
    });

    it("should handle 500 server error", async () => {
      nock("http://localhost:3000")
        .get("/users")
        .reply(500, { error: "Internal server error" });

      await expect(userDataHandler.loadUsers()).rejects.toThrow(
        "Failed to load users data: Error: Request failed with status code 500"
      );
    });
  });

  describe("getUserEmailsList", () => {
    it("should handle single user without semicolon", () => {
      userDataHandler.users = [{ id: 1, name: "John", email: "john@test.com" }];

      const emailList = userDataHandler.getUserEmailsList();
      expect(emailList).toBe("john@test.com"); // Без точки с запятой!
    });

    it("should return a semicolon-separated list of user emails", () => {
      userDataHandler.users = [
        { id: 1, name: "John", email: "john@test.com" },
        { id: 2, name: "Jane", email: "jane@test.com" },
      ];

      const emailList = userDataHandler.getUserEmailsList();
      expect(emailList).toBe("john@test.com;jane@test.com");
    });

    it("should throw error if no users are loaded", () => {
      userDataHandler.users = [];
      expect(() => userDataHandler.getUserEmailsList()).toThrow(
        "No users loaded!"
      );
    });

    it("should handle empty email fields gracefully", () => {
      const mockUsers = [
        { id: 1, name: "John", email: "" },
        { id: 2, name: "Jane", email: "jane@test.com" },
        { id: 3, name: "Bob", email: null },
        { id: 4, name: "Alice" },
      ];

      userDataHandler.users = mockUsers;

      const result = userDataHandler.getUserEmailsList();

      expect(result).toBe(";jane@test.com;;");
    });
  });

  describe("getNumberOfUsers", () => {
    it("should return the correct number of users for multiple users", () => {
      userDataHandler.users = [
        { id: 1, name: "John", email: "john@test.com" },
        { id: 2, name: "Jane", email: "jane@test.com" },
      ];

      const numberOfUsers = userDataHandler.getNumberOfUsers();
      expect(numberOfUsers).toBe(2);
    });

    it("should return 1 when there is only one user", () => {
      userDataHandler.users = [{ id: 1, name: "John", email: "john@test.com" }];
      const numberOfUsers = userDataHandler.getNumberOfUsers();
      expect(numberOfUsers).toBe(1);
    });

    it("should return 0 when no users are loaded", () => {
      userDataHandler.users = [];
      const numberOfUsers = userDataHandler.getNumberOfUsers();
      expect(numberOfUsers).toBe(0);
    });
  });

  describe("findUsers", () => {
    beforeEach(() => {
      userDataHandler.users = [
        { id: 1, name: "John", email: "john@test.com", age: 30 },
        { id: 2, name: "Jane", email: "jane@test.com", age: 25 },
        { id: 3, name: "Bob", email: "bob@test.com", age: 30 },
      ];
    });

    it("should find users matching the one search parameter", () => {
      const searchParams = { age: 30 };
      const matchingUsers = userDataHandler.findUsers(searchParams);
      expect(matchingUsers).toEqual([
        { id: 1, name: "John", email: "john@test.com", age: 30 },
        { id: 3, name: "Bob", email: "bob@test.com", age: 30 },
      ]);
    });

    it("should find users matching multiple search parameters", () => {
      const searchParams = { age: 30, name: "John" };
      const matchingUsers = userDataHandler.findUsers(searchParams);
      expect(matchingUsers).toEqual([
        { id: 1, name: "John", email: "john@test.com", age: 30 },
      ]);
    });

    it("should find users matching all search parameters", () => {
      const searchParams = {
        id: 1,
        name: "John",
        email: "john@test.com",
        age: 30,
      };
      const matchingUsers = userDataHandler.findUsers(searchParams);
      expect(matchingUsers).toEqual([
        { id: 1, name: "John", email: "john@test.com", age: 30 },
      ]);
    });

    it("should throw error if no search parameters are provided", () => {
      expect(() => userDataHandler.findUsers()).toThrow(
        "No search parameters provoded!"
      );
    });

    it("should throw error if no users are loaded", () => {
      userDataHandler.users = [];
      const searchParams = { age: 30 };
      expect(() => userDataHandler.findUsers(searchParams)).toThrow(
        "No users loaded!"
      );
    });

    it("should throw error if no matching users are found", () => {
      const searchParams = { age: 40 };
      expect(() => userDataHandler.findUsers(searchParams)).toThrow(
        "No matching users found!"
      );
    });

    it("should throw error when searching by non-existent parameter", () => {
      const searchParams = { extraParameter: "error" };
      expect(() => userDataHandler.findUsers(searchParams)).toThrow(
        "No matching users found!"
      );
    });
  });
});
