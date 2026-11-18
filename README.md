# ReLoop ♻️

Aplicativo mobile para descarte correto de lixo eletrônico (pilhas, baterias, celulares, cabos e carregadores). O usuário encontra o ecoponto mais próximo no mapa, escaneia o QR code do dispositivo de coleta, registra os itens com uma foto, ganha pontos e troca esses pontos por benefícios.

Feito com **Expo SDK 58**, **React Native 0.88**, **Expo Router** e **TypeScript**.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Credenciais de teste](#credenciais-de-teste)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Rodando o app](#rodando-o-app)
  - [Android (emulador ou celular)](#android-emulador-ou-celular)
  - [iOS (somente macOS)](#ios-somente-macos)
  - [Web](#web)
  - [Por que não funciona no Expo Go?](#por-que-não-funciona-no-expo-go)
- [Testando o fluxo de descarte](#testando-o-fluxo-de-descarte)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Scripts úteis](#scripts-úteis)
- [Build na nuvem com EAS](#build-na-nuvem-com-eas)
- [Problemas comuns](#problemas-comuns)
- [Limitações conhecidas](#limitações-conhecidas)

---

## Funcionalidades

| Área | O que faz |
| --- | --- |
| **Login e cadastro** | Entrar com e-mail e senha ou criar uma conta nova (nome, e-mail, CPF e senha). |
| **Mapa de ecopontos** | Mapa OpenStreetMap (Leaflet em WebView, sem chave de API) com os ecopontos, distância até cada um, horário de funcionamento e filtro de abertos/fechados. Usa a localização do celular ou um endereço padrão. |
| **Descarte** | Leitura do QR code do dispositivo de coleta (câmera ou imagem da galeria), validação de horário e de distância (até 300 m do ecoponto), formulário de itens e foto dos itens. |
| **Validação da foto** | A foto é analisada no próprio celular com o **Google ML Kit (Image Labeling)**, offline e gratuito, para conferir se mostra os itens declarados. |
| **Pontos e benefícios** | Cada item vale pontos. Os pontos podem ser trocados por benefícios, com histórico de resgates. |
| **Estoque (admin)** | Aba exclusiva do administrador com a ocupação dos compartimentos de cada ecoponto. |
| **Conta** | Dados do usuário e saída da conta. |

---

## Credenciais de teste

O app já vem com dois perfis cadastrados:

| Perfil | E-mail | Senha | O que pode acessar |
| --- | --- | --- | --- |
| **Administrador** | `admin@reloop.com` | `admin123` | Tudo do usuário comum + aba **Estoque** (ícone de caminhão) |
| **Usuário comum** | `demo@reloop.com` | `demo123` | Mapa, descarte, benefícios e conta |

> ⚠️ **Não há backend.** As contas, o saldo e os resgates ficam só na memória do app (veja [`src/session.tsx`](src/session.tsx)). Ao fechar o app, tudo volta ao estado inicial: contas criadas pelo cadastro somem e o saldo volta para **10.000 pontos**.

---

## Pré-requisitos

Instale antes de começar:

1. **[Node.js](https://nodejs.org/) 20 LTS ou mais recente** (o projeto foi testado com Node 24).
   ```bash
   node -v
   ```
2. **[pnpm](https://pnpm.io/installation)**, o gerenciador de pacotes do projeto (existe um `pnpm-lock.yaml`):
   ```bash
   npm install -g pnpm
   pnpm -v
   ```
3. **Git**.
4. Para rodar no **Android**:
   - [Android Studio](https://developer.android.com/studio) com o Android SDK e um emulador (AVD) criado; **ou** um celular Android com a [depuração USB ativada](https://developer.android.com/studio/debug/dev-options).
   - **JDK 17** (o Android Studio já traz um embutido).
   - Variáveis de ambiente configuradas (macOS/Linux, no `~/.zshrc` ou `~/.bashrc`):
     ```bash
     export ANDROID_HOME=$HOME/Library/Android/sdk   # Linux: $HOME/Android/Sdk
     export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
     ```
     No Windows, o caminho padrão é `%LOCALAPPDATA%\Android\Sdk`.
5. Para rodar no **iOS** (somente macOS): **Xcode** atualizado, com o simulador instalado, e **CocoaPods** (`brew install cocoapods`).

Guia oficial do ambiente: <https://docs.expo.dev/get-started/set-up-your-environment/>

---

## Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/llanunes/reloop.git
cd reloop

# 2. Instale as dependências
pnpm install

# 3. (Opcional) Confira se está tudo compatível com o SDK do Expo
pnpm exec expo-doctor
```

---

## Rodando o app

O app usa bibliotecas com código nativo (ML Kit, câmera), então ele roda como **development build**, não no Expo Go. Na primeira vez, o comando compila o app nativo (demora alguns minutos); nas próximas, basta iniciar o servidor.

### Android (emulador ou celular)

1. Abra um emulador pelo Android Studio (**Device Manager → ▶**) ou conecte o celular por USB e aceite a depuração. Confira com:
   ```bash
   adb devices
   ```
2. Compile e instale o app:
   ```bash
   pnpm android
   ```
   Isso gera a pasta `android/` (ela não vai para o Git, é gerada automaticamente), compila, instala o app no aparelho e inicia o servidor de desenvolvimento.
3. Faça login com uma das [credenciais de teste](#credenciais-de-teste).

Nas próximas vezes, com o app já instalado, basta:

```bash
pnpm start
```

e abrir o app **ReLoop** no aparelho (ou apertar `a` no terminal).

### iOS (somente macOS)

```bash
pnpm ios
```

Gera a pasta `ios/`, instala os pods, compila e abre no simulador. Para usar um iPhone físico: `pnpm ios --device` (precisa de uma conta Apple configurada no Xcode).

### Web

```bash
pnpm web
```

Abre no navegador. Serve para ver as telas, mas a **validação de foto com ML Kit não funciona na web** (é um módulo nativo) e câmera/localização dependem do navegador.

### Por que não funciona no Expo Go?

O Expo Go só traz os módulos nativos que vêm com ele. O ReLoop usa `@react-native-ml-kit/image-labeling` e `expo-dev-client`, que precisam de um app compilado. Por isso use `pnpm android` / `pnpm ios` (ou um build do EAS, veja abaixo).

---

## Testando o fluxo de descarte

O descarte exige três coisas: um **QR code válido**, o ecoponto estar **aberto** e você estar **perto dele**. Para testar sem sair de casa:

### 1. Gere um QR code de teste

O QR code do dispositivo de coleta segue o formato:

```
reloop://ecoponto/<id-do-ecoponto>/<id-do-dispositivo>
```

Use o ecoponto de teste **`amphitheatre`**, que fica **aberto 24h** e está exatamente na localização padrão do emulador Android:

```
reloop://ecoponto/amphitheatre/disp-01
```

Gere a imagem do QR code em qualquer gerador online (cole o texto acima) e:
- mostre na tela do computador e aponte a câmera do celular/emulador, **ou**
- salve a imagem no aparelho e use o botão de **escolher da galeria** na tela de leitura.

> Para enviar uma imagem ao emulador Android, basta arrastar o arquivo para a janela do emulador (ele vai para a pasta Downloads).

Outros ids de ecopontos disponíveis (em São Paulo, abertos em horário comercial): `vila-leopoldina`, `jaguare`, `lapa`, `pinheiros`, `butanta`. A lista completa está em [`src/data/ecopoints.ts`](src/data/ecopoints.ts).

### 2. Localização

- O app só deixa descartar a até **300 m** do ecoponto.
- O emulador Android, por padrão, está em Mountain View (EUA), onde fica o **Ecoponto Amphitheatre**. Para simular outro lugar: **Extended Controls (⋯) → Location** no emulador.
- Em modo de desenvolvimento, se a localização não bater, aparece o botão **"Continuar (modo dev)"** para seguir mesmo assim.

### 3. Foto dos itens

Depois do formulário, tire ou escolha uma foto dos itens. O ML Kit identifica o que aparece na imagem (em inglês, ex.: "Mobile phone") e aprova se combinar com o tipo de item escolhido. Dica: fotografe um celular ou um cabo de verdade, com boa luz.

### 4. Pontos

Ao final do fluxo os pontos entram no saldo, e você pode trocá-los na aba **Benefícios** (ícone de cesta).

---

## Estrutura do projeto

```
reloop/
├── app.json                 # Configuração do Expo (nome, permissões, plugins)
├── package.json
├── assets/                  # Ícones, imagens e splash
│   ├── icons/               # Ícones da barra de abas
│   └── images/
└── src/
    ├── app/                 # Rotas (Expo Router): cada arquivo é uma tela
    │   ├── _layout.tsx      # Raiz: fontes, sessão e proteção de rotas (login x área logada)
    │   ├── login.tsx
    │   ├── register.tsx
    │   └── (tabs)/          # Área logada
    │       ├── _layout.tsx  # Barra de abas (Estoque só aparece para admin)
    │       ├── index.tsx    # Mapa de ecopontos
    │       ├── rewards.tsx  # Benefícios e resgates
    │       ├── stock.tsx    # Estoque (admin)
    │       ├── scan.tsx     # Leitura do QR code
    │       ├── discard.tsx  # Formulário + foto do descarte
    │       ├── validated.tsx
    │       ├── weighed.tsx  # Resultado com os pontos ganhos
    │       └── account.tsx
    ├── components/          # Componentes visuais (mapa OSM, layout, botões, diálogos)
    ├── data/                # Dados de exemplo: ecopontos e itens/pontuação
    ├── hooks/               # useOrigin (localização do usuário)
    ├── services/            # photoValidation (ML Kit)
    ├── session.tsx          # Sessão em memória: contas, login, saldo, descarte
    └── theme.ts             # Cores e fontes
```

As pastas `android/` e `ios/` **não fazem parte do repositório**: são geradas pelo Expo (Continuous Native Generation) a partir do `app.json`. Não edite à mão; mude o `app.json` ou os config plugins e gere de novo.

---

## Scripts úteis

| Comando | O que faz |
| --- | --- |
| `pnpm start` | Inicia o servidor de desenvolvimento (Metro) |
| `pnpm android` | Compila e roda no Android |
| `pnpm ios` | Compila e roda no iOS |
| `pnpm web` | Roda no navegador |
| `pnpm lint` | Verifica o código com ESLint |
| `pnpm exec tsc --noEmit` | Checa os tipos do TypeScript |
| `pnpm exec expo install <pacote>` | Instala uma dependência na versão compatível com o SDK |
| `pnpm exec expo install --fix` | Corrige versões incompatíveis |
| `pnpm exec expo-doctor` | Diagnostica problemas de configuração |

> Para adicionar bibliotecas, use sempre `pnpm exec expo install <pacote>` em vez de `pnpm add`, para pegar a versão certa para o SDK 58. Se a biblioteca tiver código nativo, rode `pnpm android`/`pnpm ios` de novo.

---

## Build na nuvem com EAS

Para gerar um APK/AAB ou IPA sem Android Studio/Xcode, use o [EAS](https://docs.expo.dev/eas/):

```bash
pnpm dlx eas-cli@latest login
pnpm dlx eas-cli@latest build:configure
pnpm dlx eas-cli@latest build --profile development --platform android
```

Ao final, o EAS mostra um link/QR code para instalar o app no celular. Depois é só rodar `pnpm start` e abrir o app instalado.

---

## Problemas comuns

**`SDK location not found` / `ANDROID_HOME` não definido**
Configure a variável `ANDROID_HOME` (veja [Pré-requisitos](#pré-requisitos)) ou crie `android/local.properties` com `sdk.dir=/caminho/para/Android/sdk`.

**`No Android connected device found`**
Abra o emulador antes de rodar `pnpm android` e confira com `adb devices`.

**O app abre mas fica com tela branca / "Unable to load script"**
O servidor não está rodando ou o aparelho não o encontra. Rode `pnpm start` e, no celular físico, garanta que ele está na mesma rede Wi-Fi do computador (ou use `pnpm start --tunnel`).

**Erro de módulo nativo (ex.: `ImageLabeling` / `RNMLKitImageLabeling` não encontrado)**
Você está no Expo Go ou com um build antigo. Rode `pnpm android`/`pnpm ios` de novo para recompilar.

**Mudei o `app.json` (permissões, plugins) e nada aconteceu**
Mudanças nativas exigem regenerar o projeto: `pnpm exec expo prebuild --clean` e depois `pnpm android`.

**Cache estranho do Metro**
```bash
pnpm start --clear
```

**O mapa não aparece**
O mapa carrega os tiles do OpenStreetMap e o Leaflet pela internet. Verifique a conexão do aparelho/emulador.

---

## Limitações conhecidas

- **Sem backend:** contas, saldo e resgates ficam em memória e são perdidos ao fechar o app.
- **Dados de exemplo:** ecopontos, itens e pontuação estão fixos em `src/data/`.
- **Validação de foto simplificada:** o ML Kit reconhece o que aparece na imagem, mas não conta os itens nem reconhece pilhas com precisão.
- **Pesagem:** ainda não há integração com a balança do dispositivo de coleta; o usuário confirma manualmente.

---

## Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](LICENSE).
