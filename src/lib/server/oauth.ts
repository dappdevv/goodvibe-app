import { GitHub } from 'arctic';
import { VITE_GITHUB_CLIENT_ID, VITE_GITHUB_CLIENT_SECRET } from '$env/static/private';

// TODO: Update redirect URI
export const github = new GitHub(
	VITE_GITHUB_CLIENT_ID,
	VITE_GITHUB_CLIENT_SECRET,
	'http://localhost:5173/auth/github/callback'
);
