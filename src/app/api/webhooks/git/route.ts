import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitAppEvent } from "@/lib/events";
import { dispatchProjectWebhooks } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Support both GitHub webhook shape and direct API simulation
    const commits = body.commits || (body.type === "commit" ? [body] : []);
    const pullRequest = body.pull_request || (body.type === "pull_request" ? body : null);

    const issueKeyRegex = /([A-Z]{2,10})-(\d+)/gi;
    const results: any[] = [];

    // 1. Process Commits
    for (const c of commits) {
      const message = c.message || "";
      const matches = message.match(issueKeyRegex);

      if (matches) {
        for (const rawKey of matches) {
          const key = rawKey.toUpperCase();
          const issue = await prisma.issue.findUnique({
            where: { key },
            include: { project: true },
          });

          if (issue) {
            const commitRecord = await prisma.gitCommit.create({
              data: {
                hash: (c.id || c.hash || "manual").slice(0, 8),
                message: c.message,
                branch: c.branch || body.ref?.replace("refs/heads/", "") || null,
                authorName: c.author?.name || c.authorName || "Git Committer",
                authorEmail: c.author?.email || c.authorEmail || null,
                repoName: body.repository?.full_name || c.repoName || "project/repo",
                url: c.url || null,
                issueId: issue.id,
              },
            });

            // Write Audit Log
            await prisma.auditLog.create({
              data: {
                issueId: issue.id,
                field: "git_commit",
                oldValue: null,
                newValue: `Commit ${commitRecord.hash}: "${commitRecord.message}"`,
              },
            });

            emitAppEvent({
              type: "ISSUE_UPDATED",
              issueId: issue.id,
              projectKey: issue.project.key,
              field: "git",
            });

            dispatchProjectWebhooks(issue.projectId, "GIT_COMMIT_LINKED", {
              issueKey: issue.key,
              commit: commitRecord,
            });

            results.push({ type: "commit", key, hash: commitRecord.hash });
          }
        }
      }
    }

    // 2. Process Pull Requests
    if (pullRequest) {
      const searchTarget = `${pullRequest.title} ${pullRequest.head?.ref || pullRequest.sourceBranch || ""}`;
      const matches = searchTarget.match(issueKeyRegex);

      if (matches) {
        for (const rawKey of matches) {
          const key = rawKey.toUpperCase();
          const issue = await prisma.issue.findUnique({
            where: { key },
            include: { project: true },
          });

          if (issue) {
            const prNumber = pullRequest.number || pullRequest.prNumber || 1;
            const existingPr = await prisma.gitPullRequest.findFirst({
              where: { issueId: issue.id, prNumber },
            });

            let prStatus = "OPEN";
            if (pullRequest.merged || pullRequest.status === "MERGED") prStatus = "MERGED";
            else if (pullRequest.state === "closed" || pullRequest.status === "CLOSED") prStatus = "CLOSED";

            if (existingPr) {
              await prisma.gitPullRequest.update({
                where: { id: existingPr.id },
                data: {
                  title: pullRequest.title,
                  status: prStatus,
                },
              });
            } else {
              await prisma.gitPullRequest.create({
                data: {
                  prNumber,
                  title: pullRequest.title,
                  status: prStatus,
                  sourceBranch: pullRequest.head?.ref || pullRequest.sourceBranch || "feature",
                  targetBranch: pullRequest.base?.ref || pullRequest.targetBranch || "main",
                  repoName: body.repository?.full_name || pullRequest.repoName || "project/repo",
                  url: pullRequest.html_url || pullRequest.url || null,
                  issueId: issue.id,
                },
              });
            }

            // Write Audit Log
            await prisma.auditLog.create({
              data: {
                issueId: issue.id,
                field: "git_pr",
                oldValue: null,
                newValue: `PR #${prNumber} (${prStatus}): "${pullRequest.title}"`,
              },
            });

            emitAppEvent({
              type: "ISSUE_UPDATED",
              issueId: issue.id,
              projectKey: issue.project.key,
              field: "git",
            });

            dispatchProjectWebhooks(issue.projectId, "PULL_REQUEST_LINKED", {
              issueKey: issue.key,
              prNumber,
              status: prStatus,
            });

            results.push({ type: "pull_request", key, prNumber });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      linked: results,
      message: `Processed ${results.length} git references.`,
    });
  } catch (error) {
    console.error("Git webhook processing failed:", error);
    return NextResponse.json({ error: "Failed to process git webhook." }, { status: 500 });
  }
}
