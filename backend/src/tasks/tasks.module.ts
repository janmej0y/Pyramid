import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task, TaskSchema } from '../schemas/task.schema';
import { Project, ProjectSchema } from '../schemas/project.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Comment, CommentSchema } from '../schemas/comment.schema';
import { Activity, ActivitySchema } from '../schemas/activity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
      // Registered so deletes can clean up dependents — MongoDB has no
      // cascading deletes.
      { name: Comment.name, schema: CommentSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
