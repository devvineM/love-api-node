import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes.ts";
import { jobTitleRouter } from "../modules/job-titles/job-title.routes.ts";
import { spaceRouter } from "../modules/spaces/space.routes.ts";
import { taskRouter } from "../modules/tasks/task.routes.ts";
import { userRouter } from "../modules/users/user.routes.ts";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/job-titles", jobTitleRouter);
apiRouter.use("/spaces", spaceRouter);
apiRouter.use("/tasks", taskRouter);
apiRouter.use("/users", userRouter);
