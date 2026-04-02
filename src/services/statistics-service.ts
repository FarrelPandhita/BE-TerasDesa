import { prisma } from "../prisma/prisma-client"

// Returns aggregated counts for the admin dashboard: budget, reports, and project stats.
export async function getDashboardStats() {
  const [totalReports, unprocessedReports, totalProjects, activeProjects, finishedProjects, budgetAgg] =
    await prisma.$transaction([
      prisma.report.count(),
      prisma.report.count({ where: { status: "diterima" } }),
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
      total: totalReports,
      unprocessed: unprocessedReports,
    },
    projects: {
      total: totalProjects,
      active: activeProjects,
      finished: finishedProjects,
    },
  }
}

// Returns report counts broken down by status with percentage share of total.
export async function getReportsPieBreakdown() {
  const [diterima, diproses, selesai] = await prisma.$transaction([
    prisma.report.count({ where: { status: "diterima" } }),
    prisma.report.count({ where: { status: "diproses" } }),
    prisma.report.count({ where: { status: "selesai" } }),
  ])

  const total = diterima + diproses + selesai

  const toPercent = (n: number) =>
    total === 0 ? 0 : Math.round((n / total) * 100)

  return {
    total,
    breakdown: [
      { status: "diterima", count: diterima, percentage: toPercent(diterima) },
      { status: "diproses", count: diproses, percentage: toPercent(diproses) },
      { status: "selesai", count: selesai, percentage: toPercent(selesai) },
    ],
  }
}
