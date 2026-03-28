# Supabase Auth Email Templates
Cole estes templates no Supabase Dashboard > Authentication > Emails

## 1. Confirm sign up
**Subject:** Confirme seu email - Embaixadores dos Legendarios

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
      <tr><td style="background:linear-gradient(135deg,#FF6B00 0%,#E85D00 100%);padding:24px 32px;text-align:center;">
        <img src="https://embaixadores.marciosager.com/logo-legendarios.png" alt="Legendarios" width="48" height="48" style="display:block;margin:0 auto 12px;border-radius:12px;" />
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Embaixadores dos Legendarios</h1>
      </td></tr>
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 16px;color:#f5f5f7;font-size:18px;font-weight:600;">Confirme seu email</h2>
        <div style="color:#86868b;font-size:14px;line-height:1.6;">Obrigado por se cadastrar! Clique no botao abaixo para confirmar seu endereco de email.</div>
        <div style="text-align:center;padding:24px 0 8px;">
          <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#FF6B00,#E85D00);color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:12px;text-decoration:none;">Confirmar Email</a>
        </div>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="margin:0;color:#48484a;font-size:12px;">Legendarios - Amor, Honra, Unidade</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```

## 2. Invite user
**Subject:** Voce foi convidado - Embaixadores dos Legendarios

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
      <tr><td style="background:linear-gradient(135deg,#FF6B00 0%,#E85D00 100%);padding:24px 32px;text-align:center;">
        <img src="https://embaixadores.marciosager.com/logo-legendarios.png" alt="Legendarios" width="48" height="48" style="display:block;margin:0 auto 12px;border-radius:12px;" />
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Embaixadores dos Legendarios</h1>
      </td></tr>
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 16px;color:#f5f5f7;font-size:18px;font-weight:600;">Voce foi convidado!</h2>
        <div style="color:#86868b;font-size:14px;line-height:1.6;">Voce foi convidado para o sistema de gestao dos Embaixadores dos Legendarios. Clique no botao abaixo para aceitar o convite e criar sua senha.</div>
        <div style="text-align:center;padding:24px 0 8px;">
          <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#FF6B00,#E85D00);color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:12px;text-decoration:none;">Aceitar Convite</a>
        </div>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="margin:0;color:#48484a;font-size:12px;">Legendarios - Amor, Honra, Unidade</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```

## 3. Magic link
**Subject:** Seu link de acesso - Embaixadores dos Legendarios

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
      <tr><td style="background:linear-gradient(135deg,#FF6B00 0%,#E85D00 100%);padding:24px 32px;text-align:center;">
        <img src="https://embaixadores.marciosager.com/logo-legendarios.png" alt="Legendarios" width="48" height="48" style="display:block;margin:0 auto 12px;border-radius:12px;" />
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Embaixadores dos Legendarios</h1>
      </td></tr>
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 16px;color:#f5f5f7;font-size:18px;font-weight:600;">Seu link de acesso</h2>
        <div style="color:#86868b;font-size:14px;line-height:1.6;">Clique no botao abaixo para acessar o sistema. Este link expira em 1 hora.</div>
        <div style="text-align:center;padding:24px 0 8px;">
          <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#FF6B00,#E85D00);color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:12px;text-decoration:none;">Acessar Sistema</a>
        </div>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="margin:0;color:#48484a;font-size:12px;">Legendarios - Amor, Honra, Unidade</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```

## 4. Change email address
**Subject:** Confirme seu novo email - Embaixadores dos Legendarios

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
      <tr><td style="background:linear-gradient(135deg,#FF6B00 0%,#E85D00 100%);padding:24px 32px;text-align:center;">
        <img src="https://embaixadores.marciosager.com/logo-legendarios.png" alt="Legendarios" width="48" height="48" style="display:block;margin:0 auto 12px;border-radius:12px;" />
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Embaixadores dos Legendarios</h1>
      </td></tr>
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 16px;color:#f5f5f7;font-size:18px;font-weight:600;">Confirme seu novo email</h2>
        <div style="color:#86868b;font-size:14px;line-height:1.6;">Clique no botao abaixo para confirmar a alteracao do seu endereco de email.</div>
        <div style="text-align:center;padding:24px 0 8px;">
          <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#FF6B00,#E85D00);color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:12px;text-decoration:none;">Confirmar Novo Email</a>
        </div>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="margin:0;color:#48484a;font-size:12px;">Legendarios - Amor, Honra, Unidade</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```

## 5. Reset password
**Subject:** Redefinir sua senha - Embaixadores dos Legendarios

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
      <tr><td style="background:linear-gradient(135deg,#FF6B00 0%,#E85D00 100%);padding:24px 32px;text-align:center;">
        <img src="https://embaixadores.marciosager.com/logo-legendarios.png" alt="Legendarios" width="48" height="48" style="display:block;margin:0 auto 12px;border-radius:12px;" />
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Embaixadores dos Legendarios</h1>
      </td></tr>
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 16px;color:#f5f5f7;font-size:18px;font-weight:600;">Redefinir senha</h2>
        <div style="color:#86868b;font-size:14px;line-height:1.6;">Recebemos uma solicitacao para redefinir sua senha. Clique no botao abaixo para criar uma nova senha.</div>
        <div style="text-align:center;padding:24px 0 8px;">
          <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#FF6B00,#E85D00);color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:12px;text-decoration:none;">Redefinir Senha</a>
        </div>
        <div style="color:#48484a;font-size:12px;margin-top:16px;">Se voce nao solicitou esta alteracao, ignore este email.</div>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="margin:0;color:#48484a;font-size:12px;">Legendarios - Amor, Honra, Unidade</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```

## 6. Reauthentication
**Subject:** Confirme sua identidade - Embaixadores dos Legendarios

```html
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#0a0a0a;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
      <tr><td style="background:linear-gradient(135deg,#FF6B00 0%,#E85D00 100%);padding:24px 32px;text-align:center;">
        <img src="https://embaixadores.marciosager.com/logo-legendarios.png" alt="Legendarios" width="48" height="48" style="display:block;margin:0 auto 12px;border-radius:12px;" />
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Embaixadores dos Legendarios</h1>
      </td></tr>
      <tr><td style="padding:32px;">
        <h2 style="margin:0 0 16px;color:#f5f5f7;font-size:18px;font-weight:600;">Confirme sua identidade</h2>
        <div style="color:#86868b;font-size:14px;line-height:1.6;">Para continuar com esta acao sensivel, confirme sua identidade clicando no botao abaixo.</div>
        <div style="text-align:center;padding:24px 0 8px;">
          <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:linear-gradient(135deg,#FF6B00,#E85D00);color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:12px;text-decoration:none;">Confirmar Identidade</a>
        </div>
      </td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="margin:0;color:#48484a;font-size:12px;">Legendarios - Amor, Honra, Unidade</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
```
