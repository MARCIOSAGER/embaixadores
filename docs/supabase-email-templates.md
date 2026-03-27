# Supabase Email Templates - Embaixadores dos Legendários

## PASSO 1: Configurar Site URL

Em Supabase > Authentication > URL Configuration:
- **Site URL**: `https://embaixadores.marciosager.com`

## PASSO 2: Configurar Redirect URLs

Em Supabase > Authentication > URL Configuration > Redirect URLs, adicionar:
- `https://embaixadores.marciosager.com/**`

## PASSO 3: Copiar os templates abaixo

Em Supabase > Authentication > Email Templates, substituir cada template:

---

### 1. Invite User

**Subject:** Você foi convidado para o sistema Embaixadores dos Legendários

**Body:**
```html
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <tr>
    <td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#FF6B00 0%,#E85D00 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.02em;">Embaixadores dos Legendários</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#f5f5f7;font-size:20px;font-weight:600;">Você foi convidado!</h2>
            <p style="margin:0 0 24px;color:#86868b;font-size:15px;line-height:1.6;">
              Você foi convidado para fazer parte do sistema de gestão dos Embaixadores dos Legendários. Clique no botão abaixo para aceitar o convite e criar sua conta.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:linear-gradient(135deg,#FF6B00,#E85D00);border-radius:12px;padding:14px 32px;">
                  <a href="{{ .ConfirmationURL }}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:block;">Aceitar Convite</a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;color:#48484a;font-size:13px;line-height:1.5;text-align:center;">
              Se você não esperava este convite, pode ignorar este email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;color:#48484a;font-size:12px;">Legendários - Amor, Honra, Unidade</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

### 2. Confirm Sign Up

**Subject:** Confirme seu cadastro - Embaixadores dos Legendários

**Body:**
```html
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <tr>
    <td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#FF6B00 0%,#E85D00 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.02em;">Embaixadores dos Legendários</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#f5f5f7;font-size:20px;font-weight:600;">Confirme seu email</h2>
            <p style="margin:0 0 24px;color:#86868b;font-size:15px;line-height:1.6;">
              Obrigado por se cadastrar! Clique no botão abaixo para confirmar seu endereço de email.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:linear-gradient(135deg,#FF6B00,#E85D00);border-radius:12px;padding:14px 32px;">
                  <a href="{{ .ConfirmationURL }}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:block;">Confirmar Email</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;color:#48484a;font-size:12px;">Legendários - Amor, Honra, Unidade</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

### 3. Magic Link

**Subject:** Seu link de acesso - Embaixadores dos Legendários

**Body:**
```html
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <tr>
    <td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#FF6B00 0%,#E85D00 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.02em;">Embaixadores dos Legendários</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#f5f5f7;font-size:20px;font-weight:600;">Acesso rápido</h2>
            <p style="margin:0 0 24px;color:#86868b;font-size:15px;line-height:1.6;">
              Clique no botão abaixo para acessar o sistema. Este link é válido por tempo limitado.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:linear-gradient(135deg,#FF6B00,#E85D00);border-radius:12px;padding:14px 32px;">
                  <a href="{{ .ConfirmationURL }}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:block;">Acessar Sistema</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;color:#48484a;font-size:12px;">Legendários - Amor, Honra, Unidade</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

### 4. Change Email Address

**Subject:** Confirme seu novo email - Embaixadores dos Legendários

**Body:**
```html
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <tr>
    <td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#FF6B00 0%,#E85D00 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.02em;">Embaixadores dos Legendários</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#f5f5f7;font-size:20px;font-weight:600;">Alteração de email</h2>
            <p style="margin:0 0 24px;color:#86868b;font-size:15px;line-height:1.6;">
              Confirme a alteração do seu endereço de email clicando no botão abaixo.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:linear-gradient(135deg,#FF6B00,#E85D00);border-radius:12px;padding:14px 32px;">
                  <a href="{{ .ConfirmationURL }}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:block;">Confirmar Novo Email</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;color:#48484a;font-size:12px;">Legendários - Amor, Honra, Unidade</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

### 5. Reset Password

**Subject:** Redefinir senha - Embaixadores dos Legendários

**Body:**
```html
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <tr>
    <td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#FF6B00 0%,#E85D00 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.02em;">Embaixadores dos Legendários</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#f5f5f7;font-size:20px;font-weight:600;">Redefinir senha</h2>
            <p style="margin:0 0 24px;color:#86868b;font-size:15px;line-height:1.6;">
              Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:linear-gradient(135deg,#FF6B00,#E85D00);border-radius:12px;padding:14px 32px;">
                  <a href="{{ .ConfirmationURL }}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:block;">Redefinir Senha</a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;color:#48484a;font-size:13px;line-height:1.5;text-align:center;">
              Se você não solicitou esta alteração, pode ignorar este email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;color:#48484a;font-size:12px;">Legendários - Amor, Honra, Unidade</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

### 6. Reauthentication

**Subject:** Código de confirmação - Embaixadores dos Legendários

**Body:**
```html
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <tr>
    <td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#FF6B00 0%,#E85D00 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.02em;">Embaixadores dos Legendários</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;text-align:center;">
            <h2 style="margin:0 0 16px;color:#f5f5f7;font-size:20px;font-weight:600;">Confirme sua identidade</h2>
            <p style="margin:0 0 24px;color:#86868b;font-size:15px;line-height:1.6;">
              Digite o código abaixo para confirmar a ação solicitada.
            </p>
            <div style="background:rgba(255,107,0,0.1);border:1px solid rgba(255,107,0,0.3);border-radius:12px;padding:20px;display:inline-block;">
              <span style="color:#FF6B00;font-size:32px;font-weight:800;letter-spacing:8px;">{{ .Token }}</span>
            </div>
            <p style="margin:24px 0 0;color:#48484a;font-size:13px;line-height:1.5;">
              Se você não solicitou este código, pode ignorar este email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;color:#48484a;font-size:12px;">Legendários - Amor, Honra, Unidade</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```
