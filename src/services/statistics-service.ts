import { prisma } from "../prisma/prisma-client"

// Global Dashboard Statistics
export async function getDashboardStats() {
  const [totalProjects, activeProjects, finishedProjects, budgetAgg] =
    await prisma.$transaction([
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.project.count({ where: { deletedAt: null, status: "berjalan" } }),
      prisma.project.count({ where: { deletedAt: null, status: "selesai" } }),
      prisma.project.aggregate({
        where: { deletedAt: null },
        _sum: { totalBudget: true },
      }),
    ])

  return {
    total_budget: budgetAgg._sum.totalBudget?.toString() ?? "0",
    reports: {
      total: 0,
      unprocessed: 0,
    },
    projects: {
      total: totalProjects,
      active: activeProjects,
      finished: finishedProjects,
    },
  }
}
