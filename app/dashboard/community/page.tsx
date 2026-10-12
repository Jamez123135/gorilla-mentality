"use client";

import { useEffect, useState } from "react";
import {
  Heart,
  MessageSquare,
  Send,
  Trash2,
  Pencil,
  Flag,
  X,
  RefreshCw,
} from "lucide-react";
import {
  getCommunityFeed,
  publishCommunityPost,
  editCommunityPost,
  deleteCommunityPost,
  setCommunityLike,
  getCommunityComments,
  publishCommunityComment,
  deleteCommunityComment,
  reportCommunityPost,
  getCommunityReports,
  dismissCommunityReport,
} from "@/app/lib/actions/community";

type Feed = Awaited<ReturnType<typeof getCommunityFeed>>;
const field =
  "mt-2 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-white";
const command =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black disabled:opacity-50";
export default function CommunityPage() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("milestone");
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [thread, setThread] = useState<string | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reports, setReports] = useState<
    Awaited<ReturnType<typeof getCommunityReports>>
  >([]);
  async function refresh() {
    setFeed(await getCommunityFeed());
  }
  useEffect(() => {
    let active = true;
    getCommunityFeed()
      .then((data) => {
        if (active) setFeed(data);
      })
      .catch(() => {
        if (active) setError("Unable to load the community. Please try again.");
      });
    return () => {
      active = false;
    };
  }, []);
  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to complete this action.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-3xl p-4 md:p-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-yellow-500">
            Gorilla Mentality Members
          </p>
          <h1 className="mt-2 text-3xl font-bold">Community</h1>
        </div>
        <button
          title="Refresh community"
          aria-label="Refresh community"
          disabled={busy}
          onClick={() => run(refresh)}
          className="p-2 text-zinc-400 hover:text-white"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </header>
      <p className="mb-6 text-sm text-zinc-400">
        Member-only. Be respectful. No harassment, spam, or unsafe health
        advice. Posts and display names are visible to other members; your
        tracking records stay private.
      </p>
      {error && (
        <p role="alert" className="mb-4 text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mb-4 text-green-400">
          {message}
        </p>
      )}
      <form
        className="border-y border-zinc-800 py-6"
        onSubmit={(event) => {
          event.preventDefault();
          run(async () => {
            const input = { authorName, body, category };
            if (editing) await editCommunityPost(editing, input);
            else await publishCommunityPost(input);
            setBody("");
            setEditing(null);
            setMessage("Post shared with the community.");
            await refresh();
          });
        }}
      >
        <fieldset disabled={busy} className="min-w-0 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-zinc-400">
              Public display name
              <input
                required
                maxLength={40}
                value={authorName}
                onChange={(event) => setAuthorName(event.target.value)}
                className={field}
              />
            </label>
            <label className="text-sm text-zinc-400">
              Topic
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={field}
              >
                <option value="milestone">Milestone</option>
                <option value="workout">Training</option>
                <option value="nutrition">Nutrition</option>
                <option value="question">Question</option>
              </select>
            </label>
          </div>
          <label className="block text-sm text-zinc-400">
            {editing ? "Edit post" : "Share with the community"}
            <textarea
              required
              maxLength={2000}
              rows={3}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className={field}
            />
          </label>
          <div className="flex items-center gap-4">
            <button className={command}>
              <Send className="h-4 w-4" />
              {editing ? "Save post" : "Share post"}
            </button>
            {editing && (
              <button
                type="button"
                title="Cancel edit"
                aria-label="Cancel edit"
                onClick={() => {
                  setEditing(null);
                  setBody("");
                }}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </fieldset>
      </form>
      {!feed && !error && (
        <p role="status" className="py-6 text-zinc-400">
          Loading community...
        </p>
      )}
      {feed?.moderator && (
        <section className="border-b border-zinc-800 py-5">
          <button
            disabled={busy}
            className="text-yellow-500 underline"
            onClick={() =>
              run(async () => setReports(await getCommunityReports()))
            }
          >
            Review reports
          </button>
          {reports.map((report) => (
            <div
              key={report.id}
              className="mt-4 border-l-2 border-red-400 pl-4"
            >
              <p className="break-words text-sm">{report.reason}</p>
              <p className="my-2 break-words text-sm text-zinc-400">
                {report.post.authorName}: {report.post.body}
              </p>
              <div className="flex gap-4">
                <button
                  disabled={busy}
                  title="Remove reported post"
                  aria-label="Remove reported post"
                  onClick={() =>
                    run(async () => {
                      await deleteCommunityPost(report.post.id);
                      setReports(await getCommunityReports());
                      await refresh();
                    })
                  }
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await dismissCommunityReport(report.id);
                      setReports(await getCommunityReports());
                    })
                  }
                  className="text-sm underline"
                >
                  Dismiss report
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
      {feed && !feed.posts.length && (
        <p className="py-8 text-zinc-400">No posts yet.</p>
      )}
      <div className="divide-y divide-zinc-800">
        {feed?.posts.map((post) => (
          <article key={post.id} className="py-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words font-semibold">{post.authorName}</p>
                <p className="mt-1 text-xs capitalize text-zinc-500">
                  {post.category} /{" "}
                  <time dateTime={post.createdAt}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </time>
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {post.mine && (
                  <button
                    disabled={busy}
                    title="Edit post"
                    aria-label="Edit post"
                    className="p-1 text-zinc-400 hover:text-white"
                    onClick={() => {
                      setEditing(post.id);
                      setBody(post.body);
                      setCategory(post.category);
                      setAuthorName(post.authorName);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {post.removable && (
                  <button
                    disabled={busy}
                    title="Delete post"
                    aria-label="Delete post"
                    className="p-1 text-zinc-400 hover:text-red-400"
                    onClick={() => {
                      if (window.confirm("Delete this post and its comments?"))
                        run(async () => {
                          await deleteCommunityPost(post.id);
                          await refresh();
                        });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                {!post.mine && (
                  <button
                    disabled={busy}
                    title="Report post"
                    aria-label="Report post"
                    className="p-1 text-zinc-400 hover:text-red-400"
                    onClick={() => {
                      setReporting(post.id);
                      setReason("");
                    }}
                  >
                    <Flag className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="my-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200 [overflow-wrap:anywhere]">
              {post.body}
            </p>
            <div className="flex gap-6">
              <button
                disabled={busy}
                aria-label={post.liked ? "Unlike post" : "Like post"}
                aria-pressed={post.liked}
                onClick={() =>
                  run(async () => {
                    await setCommunityLike(post.id, !post.liked);
                    setFeed((current) =>
                      current
                        ? {
                            ...current,
                            posts: current.posts.map((row) =>
                              row.id === post.id
                                ? {
                                    ...row,
                                    liked: !post.liked,
                                    likes: row.likes + (post.liked ? -1 : 1),
                                  }
                                : row,
                            ),
                          }
                        : current,
                    );
                  })
                }
                className={`flex items-center gap-2 text-sm ${post.liked ? "text-yellow-500" : "text-zinc-400"}`}
              >
                <Heart
                  className={`h-4 w-4 ${post.liked ? "fill-current" : ""}`}
                />
                {post.likes}
              </button>
              <button
                aria-label="View comments"
                aria-expanded={thread === post.id}
                onClick={() => setThread(thread === post.id ? null : post.id)}
                className="flex items-center gap-2 text-sm text-zinc-400"
              >
                <MessageSquare className="h-4 w-4" />
                {post.comments}
              </button>
            </div>
            {reporting === post.id && (
              <form
                className="mt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  run(async () => {
                    await reportCommunityPost(post.id, reason);
                    setReporting(null);
                    setMessage("Report sent for moderator review.");
                  });
                }}
              >
                <label className="text-sm text-zinc-400">
                  Reason for report
                  <textarea
                    required
                    minLength={3}
                    maxLength={300}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className={field}
                  />
                </label>
                <div className="mt-3 flex gap-4">
                  <button disabled={busy} className={command}>
                    <Flag className="h-4 w-4" />
                    Send report
                  </button>
                  <button
                    type="button"
                    title="Cancel report"
                    aria-label="Cancel report"
                    onClick={() => setReporting(null)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </form>
            )}
            {thread === post.id && (
              <CommentThread
                postId={post.id}
                authorName={authorName}
                onCountChange={(delta) =>
                  setFeed((current) =>
                    current
                      ? {
                          ...current,
                          posts: current.posts.map((row) =>
                            row.id === post.id
                              ? { ...row, comments: row.comments + delta }
                              : row,
                          ),
                        }
                      : current,
                  )
                }
              />
            )}
          </article>
        ))}
      </div>
      {feed?.next && (
        <button
          disabled={busy}
          onClick={() =>
            run(async () => {
              const older = await getCommunityFeed(feed.next!);
              setFeed({ ...older, posts: [...feed.posts, ...older.posts] });
            })
          }
          className="my-6 text-yellow-500 underline"
        >
          Older posts
        </button>
      )}
    </main>
  );
}

function CommentThread({
  postId,
  authorName,
  onCountChange,
}: {
  postId: string;
  authorName: string;
  onCountChange: (delta: number) => void;
}) {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof getCommunityComments>
  > | null>(null);
  const [commentName, setCommentName] = useState(authorName);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getCommunityComments(postId)
      .then((rows) => {
        if (active) setData(rows);
      })
      .catch(() => {
        if (active) setError("Unable to load comments.");
      });
    return () => {
      active = false;
    };
  }, [postId]);
  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to update comments.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-5 border-l border-zinc-700 pl-4">
      {error && (
        <p role="alert" className="my-3 text-sm text-red-400">
          {error}
        </p>
      )}
      {data?.comments.map((comment) => (
        <div key={comment.id} className="mb-4">
          <div className="flex justify-between gap-3">
            <p className="break-words text-sm font-semibold">
              {comment.authorName}
            </p>
            {comment.removable && (
              <button
                disabled={busy}
                title="Delete comment"
                aria-label="Delete comment"
                onClick={() => {
                  if (window.confirm("Delete this comment?"))
                    run(async () => {
                      await deleteCommunityComment(comment.id);
                      setData(await getCommunityComments(postId));
                      onCountChange(-1);
                    });
                }}
              >
                <Trash2 className="h-4 w-4 text-zinc-400" />
              </button>
            )}
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-400 [overflow-wrap:anywhere]">
            {comment.body}
          </p>
        </div>
      ))}
      {data?.next && (
        <button
          disabled={busy}
          onClick={() =>
            run(async () => {
              const older = await getCommunityComments(postId, data.next!);
              setData({
                ...older,
                comments: [...data.comments, ...older.comments],
              });
            })
          }
          className="mb-3 text-sm text-yellow-500 underline"
        >
          Older comments
        </button>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          run(async () => {
            await publishCommunityComment({
              postId,
              authorName: commentName,
              body,
            });
            setBody("");
            setData(await getCommunityComments(postId));
            onCountChange(1);
          });
        }}
      >
        <label className="mb-3 block text-sm text-zinc-400">
          Comment display name
          <input
            required
            maxLength={40}
            value={commentName}
            onChange={(event) => setCommentName(event.target.value)}
            className={field}
          />
        </label>
        <label className="block text-sm text-zinc-400">
          Comment
          <textarea
            required
            maxLength={500}
            rows={2}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className={field}
          />
        </label>
        <button disabled={busy} className={command + " mt-3"}>
          <Send className="h-4 w-4" />
          Post comment
        </button>
      </form>
    </section>
  );
}
