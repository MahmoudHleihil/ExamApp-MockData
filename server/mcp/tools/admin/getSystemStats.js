import { z } from "zod";
import MCPTool from "../../tool.js";
import registry from "../../registry.js";
import UserService from "../../../services/UserService.js";

const getSystemStats = new MCPTool({
  name: "get_system_stats",
  description: "Get system statistics. Admin only.",
  permissions: ["Admin"],
  schema: z.object({}),

  async execute(args, context) {
    return UserService.getSystemStats();
  },
});

registry.register(getSystemStats);

export default getSystemStats;