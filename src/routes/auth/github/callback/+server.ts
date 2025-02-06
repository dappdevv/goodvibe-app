// routes/login/github/callback/+server.ts
import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/session';
import { github } from '$lib/server/oauth';
import { ObjectParser } from '@pilcrowjs/object-parser';
import { createUser, getUserFromGitHubId } from '$lib/server/user';
import type { RequestEvent } from '@sveltejs/kit';
import type { OAuth2Tokens } from 'arctic';

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('github_oauth_state') ?? null;
	if (code === null || state === null || storedState === null) {
		return new Response(null, {
			status: 400
		});
	}
	if (state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await github.validateAuthorizationCode(code);
	} catch (e) {
		// Invalid code or client credentials
		return new Response(null, {
			status: 400
		});
	}
	const githubUserResponse = await fetch('https://api.github.com/user', {
		headers: {
			Authorization: `Bearer ${tokens.accessToken()}`
		}
	});
	const githubUser = await githubUserResponse.json();
	const githubUserId = githubUser.id;
	const githubUsername = githubUser.login;

	console.log('*************************************************************');
	console.log('githubUser: ', githubUser);
	console.log('*************************************************************');

	// TODO: Replace this with your own DB query.
	const existingUser = await getUserFromGitHubId(githubUserId);

	if (existingUser) {
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, existingUser.id);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);
		return new Response(null, {
			status: 302,
			headers: {
				Location: '/'
			}
		});
	}

	// const emailListRequest = new Request('https://api.github.com/user/emails');
	// emailListRequest.headers.set('Authorization', `Bearer ${githubAccessToken}`);
	// const emailListResponse = await fetch(emailListRequest);
	// const emailListResult: unknown = await emailListResponse.json();
	// if (!Array.isArray(emailListResult) || emailListResult.length < 1) {
	// 	return new Response('Please restart the process.', {
	// 		status: 400
	// 	});
	// }
	// let email: string | null = null;
	// for (const emailRecord of emailListResult) {
	// 	const emailParser = new ObjectParser(emailRecord);
	// 	const primaryEmail = emailParser.getBoolean('primary');
	// 	const verifiedEmail = emailParser.getBoolean('verified');
	// 	if (primaryEmail && verifiedEmail) {
	// 		email = emailParser.getString('email');
	// 	}
	// }
	// if (email === null) {
	// 	return new Response('Please verify your GitHub email address.', {
	// 		status: 400
	// 	});
	// }

	// TODO: Replace this with your own DB query.
	const email = 'dappdev9@gmail.com';
	const user = await createUser(githubUserId, email, githubUsername);

	const sessionToken = generateSessionToken();
	const session = await createSession(sessionToken, user.id);
	setSessionTokenCookie(event, sessionToken, session.expiresAt);

	return new Response(null, {
		status: 302,
		headers: {
			Location: '/'
		}
	});
}
