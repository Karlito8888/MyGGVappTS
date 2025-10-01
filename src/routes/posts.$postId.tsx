import { Link, createFileRoute, getRouteApi } from "@tanstack/react-router";
import { requireAuth, requireOnboarding } from "../lib/routeGuards";
import "./posts.css";

interface Post {
	id: number;
	title: string;
	body: string;
	userId: number;
}

interface Comment {
	id: number;
	postId: number;
	name: string;
	email: string;
	body: string;
}

const postApi = getRouteApi("/posts/$postId");

export const Route = createFileRoute("/posts/$postId")({
	beforeLoad: async ({ context }) => {
		await requireAuth(context);
		await requireOnboarding(context);
	},
	component: PostDetail,
	loader: async ({ params, abortController }) => {
		// Check if request was aborted
		if (abortController.signal.aborted) {
			throw new Error("Request aborted");
		}

		// Simulate API call to fetch single post
		const response = await fetch(
			`https://jsonplaceholder.typicode.com/posts/${params.postId}`,
			{ signal: abortController.signal },
		);
		if (!response.ok) {
			throw new Error("Failed to fetch post");
		}
		const post: Post = await response.json();

		// Fetch comments for this post
		const commentsResponse = await fetch(
			`https://jsonplaceholder.typicode.com/posts/${params.postId}/comments`,
			{ signal: abortController.signal },
		);
		if (!commentsResponse.ok) {
			throw new Error("Failed to fetch comments");
		}
		const comments: Comment[] = await commentsResponse.json();

		return { post, comments };
	},
	pendingComponent: () => (
		<div className="loading-container">
			<div className="loading-spinner">⏳</div>
			<p>Loading post...</p>
		</div>
	),
	errorComponent: ({ error }) => (
		<div className="error-container">
			<h2>⚠️ Error Loading Post</h2>
			<p>{error.message}</p>
		</div>
	),
});

function PostDetail() {
	const { post, comments } = postApi.useLoaderData({
		select: (data) => ({
			post: data.post,
			comments: data.comments,
		}),
		structuralSharing: true,
	});

	return (
		<main className="main-content">
			<Link to="/posts" className="back-link">
				← Back to Posts
			</Link>

			<article className="post-detail">
				<h1 className="post-title">{post.title}</h1>
				<p className="post-body">{post.body}</p>

				<section className="comments-section">
					<h3 className="comments-title">💬 Comments ({comments.length})</h3>
					<div className="comments-list">
						{comments.map((comment: Comment) => (
							<div key={comment.id} className="comment-card">
								<h4 className="comment-author">{comment.email}</h4>
								<p className="comment-body">{comment.body}</p>
							</div>
						))}
					</div>
				</section>
			</article>
		</main>
	);
}
