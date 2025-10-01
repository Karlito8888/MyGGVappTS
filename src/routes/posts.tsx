import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { requireAuth, requireOnboarding } from "../lib/routeGuards";
import "./posts.css";

interface Post {
	id: number;
	title: string;
	body: string;
	userId: number;
}

export const Route = createFileRoute("/posts")({
	beforeLoad: async ({ context }) => {
		await requireAuth(context);
		await requireOnboarding(context);
	},
	component: Posts,
	loader: async ({ abortController }) => {
		// Check if request was aborted
		if (abortController.signal.aborted) {
			throw new Error("Request aborted");
		}

		// Simulate API call to fetch posts
		const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
			signal: abortController.signal,
		});
		if (!response.ok) {
			throw new Error("Failed to fetch posts");
		}
		const posts: Post[] = await response.json();
		return { posts };
	},
	pendingComponent: () => (
		<div className="loading-container">
			<div className="loading-spinner">⏳</div>
			<p>Loading posts...</p>
		</div>
	),
	errorComponent: ({ error }) => {
		const navigate = useNavigate();
		return (
			<div className="error-container">
				<h2>⚠️ Error Loading Posts</h2>
				<p>{error.message}</p>
				<button
					type="button"
					onClick={() => {
						navigate({ to: "/posts" });
					}}
				>
					Retry
				</button>
			</div>
		);
	},
});

function Posts() {
	const posts = Route.useLoaderData({
		select: (data) => data.posts,
		structuralSharing: true,
	});

	return (
		<main className="main-content">
			<h2 className="page-title">📝 Posts</h2>

			<div className="posts-list">
				{posts.map((post: Post) => (
					<div key={post.id} className="post-card">
						<h3 className="post-title">{post.title}</h3>
						<p className="post-body">{post.body.substring(0, 100)}...</p>
						<Link
							to="/posts/$postId"
							params={{ postId: post.id.toString() }}
							className="read-more-link"
						>
							Read More
						</Link>
					</div>
				))}
			</div>
		</main>
	);
}
