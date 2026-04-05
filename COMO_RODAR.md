# ObraControl Web — Como Rodar

## Requisitos
- Node.js 18+ instalado (https://nodejs.org)
- npm ou yarn

---

## 1. Instalar dependências

```bash
cd obra-control
npm install
```

## 2. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 3. Build para produção

```bash
npm run build
npm start
```

---

## Credenciais de acesso

| Email                  | Senha     |
|------------------------|-----------|
| admin@obra.com         | 123456    |
| engenheiro@obra.com    | senha123  |

---

## Funcionalidades disponíveis

- **Login** com sessão persistida (localStorage)
- **Dashboard** com totais gerais e obras recentes
- **Obras** — CRUD completo, cards responsivos, filtros
- **Obra detalhe** — info, financeiro com tabela, equipe vinculada
- **Trabalhadores** — CRUD completo, vincular/desvincular por obra
- **Financeiro** — visão global com todos os lançamentos e filtros
- **Exportação .xlsx** — botão "Exportar" no detalhe de cada obra
- **Logout** na sidebar / menu mobile

---

## Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/login/          # Página de login
│   ├── (dashboard)/           # Área protegida
│   │   ├── page.tsx           # Dashboard principal
│   │   ├── obras/             # Lista e detalhe de obras
│   │   ├── trabalhadores/     # Lista de trabalhadores
│   │   └── financeiro/        # Visão financeira global
│   ├── layout.tsx             # Root layout
│   └── globals.css
├── components/
│   ├── layout/                # Sidebar, Header (mobile)
│   └── ui/                    # Button, Input, Modal, Badge, Card...
├── store/                     # Zustand (auth, obras, trabalhadores, financeiro)
├── services/                  # authService (mock → API-ready)
├── types/                     # TypeScript interfaces
├── lib/                       # utils, export (xlsx)
└── utils/                     # format, mockData
```

---

## Como os dados são persistidos

Os dados ficam no **localStorage** do navegador via Zustand persist.
Na primeira visita, os dados mock são inseridos automaticamente.

Para limpar todos os dados e recomeçar:
- Abra o DevTools (F12) → Application → Local Storage → Clear all

---

## Como integrar com backend real no futuro

1. **Auth**: substitua apenas `src/services/authService.ts` — o template REST já está comentado
2. **CRUD**: substitua os métodos dos stores para chamar API em vez de mutate local state
3. **Persistência**: remova o `persist` do Zustand e use React Query ou SWR para fetching
4. Nada nos componentes/pages precisa mudar

---

## Responsividade

- **Mobile**: menu hambúrguer, cards em coluna única, tabelas com scroll horizontal
- **Tablet**: grid 2 colunas
- **Desktop**: sidebar fixa, grid 3 colunas, tabelas completas
