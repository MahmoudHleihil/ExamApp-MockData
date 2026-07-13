import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import UserService from "../../../services/UserService.js";

const getAllUsers = new MCPTool({
  name: "get_all_users",
  description: "Get all users without passwords. Admin only.",
  permissions: ["Admin"],
  schema: z.object({}),

  async execute(args, context) {
    return UserService.getAllUsers();
  },
});

registry.register(getAllUsers);

export default getAllUsers;