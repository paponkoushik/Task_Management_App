import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSprintBoardViewModel } from "@/services/task-orbit-service";
import { SprintBoard } from "./_components/sprint-board";

export default async function SprintPage({
  params,
}: {
  params: Promise<{ sprintId: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const { sprintId } = await params;
  const parsedSprintId = Number(sprintId);

  if (!Number.isInteger(parsedSprintId) || parsedSprintId <= 0) {
    notFound();
  }

  const sprintBoard = await getSprintBoardViewModel({
    currentUser,
    sprintId: parsedSprintId,
  });

  if (!sprintBoard) {
    notFound();
  }

  const boardVersion = [
    sprintBoard.sprint.updatedAt,
    ...sprintBoard.tasks.map((task) => task.updatedAt),
    ...sprintBoard.backlogTasks.map((task) => task.updatedAt),
  ].join("-");

  return <SprintBoard key={`${sprintBoard.sprint.id}-${boardVersion}`} {...sprintBoard} />;
}
