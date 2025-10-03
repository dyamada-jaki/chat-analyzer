import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';

const router: Router = Router();

// Google OAuth設定
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5175';
const oAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);

/**
 * Google OAuth認証エンドポイント
 */
router.post('/google', (req: Request, res: Response) => {
  try {
    const { id, name, email, picture, token } = req.body;
    
    console.log('🔐 Google認証受信:', { id, name, email });
    
    // ユーザー情報を検証（実際のプロダクションではJWTトークンを検証）
    if (!id || !name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user information'
      });
    }
    
    // セッション情報を作成（実際のプロダクションではデータベースに保存）
    const userSession = {
      userId: id,
      name,
      email,
      picture,
      authenticatedAt: new Date().toISOString(),
      isAuthenticated: true
    };
    
    console.log('✅ ユーザー認証成功:', userSession);
    
    res.json({
      success: true,
      message: 'Google authentication successful',
      user: userSession
    });
    
  } catch (error) {
    console.error('❌ Google認証エラー:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

/**
 * ユーザーセッション確認エンドポイント
 */
router.get('/session', (req: Request, res: Response) => {
  // 実際のプロダクションではセッションストアからユーザー情報を取得
  res.json({
    success: true,
    message: 'Session endpoint ready',
    authenticated: false
  });
});

/**
 * 認証コードをアクセストークンに交換
 */
router.post('/exchange-token', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }
    
    console.log('🔄 認証コード交換開始:', code.substring(0, 10) + '...');
    
    // 認証コードをアクセストークンに交換
    const { tokens } = await oAuth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('Failed to get access token');
    }
    
    console.log('✅ アクセストークン取得成功');
    
    // アクセストークンを使ってユーザー情報を取得
    oAuth2Client.setCredentials(tokens);
    const userInfoResponse = await oAuth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo'
    });
    
    const userInfo = userInfoResponse.data as any;
    
    const user = {
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture
    };
    
    console.log('✅ ユーザー情報取得成功:', user);
    
    res.json({
      success: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user,
      message: 'Token exchange successful'
    });
    
  } catch (error) {
    console.error('❌ トークン交換エラー:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Token exchange failed'
    });
  }
});

/**
 * ログアウトエンドポイント
 */
router.post('/logout', (req: Request, res: Response) => {
  try {
    console.log('🚪 ユーザーログアウト');
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
    
  } catch (error) {
    console.error('❌ ログアウトエラー:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

export default router;
