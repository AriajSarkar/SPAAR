import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
    sub: string;
    exp: number;
    iat: number;
}

/**
 * Middleware to verify authorization tokens client-side
 * Reduces the need for constant profile API calls
 */
export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest) => {
        try {
            // Get token from cookie
            const accessToken = req.cookies.get('access_token')?.value;

            // If no token, return unauthorized
            if (!accessToken) {
                return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
            }

            try {
                // Verify token expiration locally (without API call)
                const payload = jwtDecode<TokenPayload>(accessToken);
                const currentTime = Math.floor(Date.now() / 1000);

                // Check if token is expired
                if (payload.exp < currentTime) {
                    return NextResponse.json({ error: 'Unauthorized - Token expired' }, { status: 401 });
                }

                // Token is valid, proceed with request handler
                return handler(req);
            } catch (tokenError) {
                console.error('Token validation error:', tokenError);
                return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
            }
        } catch (error) {
            console.error('Auth middleware error:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    };
}
