import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project, ProjectSchema } from '../schemas/project.schema';
import { Task, TaskSchema } from '../schemas/task.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Comment, CommentSchema } from '../schemas/comment.schema';
import { Activity, ActivitySchema } from '../schemas/activity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
      { name: User.name, schema: UserSchema },
      // Registered so deleting a project can clean up its tasks' dependents.
      { name: Comment.name, schema: CommentSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
