---
title: '今日からはじめるReactのテスト実践'
emoji: '🦁'
type: 'tech'
topics: [React, TypeScript, Test, Jest, ReactTestingLibrary]
published: true
---

# あるフロントエンドの悩み

ふぃ〜、明日はいよいよリリースか、今日は備えて早めに寝るとするか。。。

…………ブウウ――――ンンン――――ンンンン…………

そういえば、あれか、月曜日に直したところはちゃんとチェックしたっけか
...いや火曜日にテストしたな。オーケー。オーケー。

…………ブウウ――――ンンン――――ンンンン…………

いやでもひょっとして、あれあっちの箇所にも影響出てないかな？
...大丈夫か、うーん、まぁ大丈夫だろう。

…………ブウウ――――ンンン――――ンンンン…………

いや心配だな。気になって眠れん.........。

# JestとReactTestingLibrary

ということで(?)、今回はスッキリ7時間寝てから、自信をもってリリースするためにテストを書いていこうという話です。ルールっぽいところは[今日からはじめるReactのテスト戦略](https://zenn.dev/t_keshi/articles/react-test-rule)の方に書かせていただきました。ここでは、JestとReactTestingLibraryを使って、実際にどう書いていくかというところにフォーカスしていきたいと思います

テストについて調べると、カウンターアプリやFizzBuzzなどをサンプルにしたものが多く実際にどう書いたらいいか悩んだ経験があるので、今回、実際に普段業務で開発するアプリケーションに近いと思われるサンプルを用意しました。

こちらになります。
[React Test](https://react-test-lion-bog90pi11-t-keshi.vercel.app/)

ログインすると、自分のプロフィールが編集でき、他のユーザーのプロフィールが閲覧できるというようなアプリケーションです。Web上の電話帳のようなものをイメージしていただければ幸いです。
(認証部分は仮で作っていて、どんなメールアドレスでも同じユーザーとしてログインされます。)

## テストのセットアップ

CreateReactAppの場合は、テストの環境が予め自動でセットアップされています。
これに少しだけ手を加えます。

以下のライブラリをインストールします。

``` shell
yarn add @testing-library/jest-dom
yarn add @testing-library/user-event
```

モックサーバーを立てている場合には、テスト毎にモックサーバーをリセットするためのコードを`setupTests.ts`に追加します。
モックサーバーの立て方は色々ありますが、個人的には`msw`で立てるのがおすすめです。[まだAPIが出来ていない？私は一向にかまわんッッ](https://zenn.dev/t_keshi/articles/react-test-rule)で`msw`について書いているので、よかったら覗いてあげてください。泣いて喜びます。

``` typescript: setupTests.ts
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import { server } from './tests/handlers/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers();
afterAll(() => server.close());
```

また、テストを正確に書きやすくするために、以下のeslintのプラグインを追加すると良いと思います。これはオプションです。

``` shell
yarn add -D eslint-plugin-jest-dom
yarn add -D eslint-plugin-testing-library
```

``` javascript: eslintrc.js
module.exports = {
  extends: [
    'plugin:jest-dom/recommended',
  ],
  plugins: [
    'jest-dom',
    'testing-library',
  ],
  overrides: [
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:testing-library/react'],
    },
  ]
}
```

最後に、状態管理やUIライブラリのProviderをラップしておいてくれるように、`@testing-library/react`の`render`をカスタムしたものを用意しておくと、テストを書くのが少し楽になります。

``` typescript: test-utils.ts
import { FC, ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { Provider, store, ThemeProvider, theme } from './providers';

const AllTheProviders: FC = ({ children }) => (
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </Provider>
);

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>): RenderResult =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

これでセットアップは完了です！

# ReactTestingLibrary

## ログインページのテスト

ログインページでは、以下の仕様があるとします。

- 正しいEメールとパスワードが入力されていればログインができる
- 入力が正しくない場合はユーザーにエラーメッセージを出す
- ユーザーがEメールアドレスとパスワードを入力するまではログインボタンは押せない状態になっている

次のような流れでテストしていきたいです。

``` typescript: Login.test.tsx
import { render, waitFor } from '../../test-utils';
import { Login } from './Login';

test('ログインページのテスト', () => {
  render(<Login />);

  // ユーザーは、ログインしていない
  // ↓
  // ログインボタンは押せない状態になっている
  // ↓
  // フォームをすべて入力するとログインボタンは押せる状態になる
  // ↓
  // 入力が適切でないとエラーが表示され、ログインできない
  // ↓
  // 入力が適切だとエラーが表示されず、ログインできる
});
```

では、実際にやっていきます。

``` typescript: Login.test.tsx
import { render, waitFor, screen, getByRole, getByLabelText } from '../../test-utils';
import { Login } from './Login';

test('ログインページのテスト', () => {
  render(<Login />);

  // ユーザーは、ログインしていない
  expect(getUserIdFromCookie()).toBeUndefined();

  // ログインボタンは押せない状態になっている
  expect(screen.getByRole('button')).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeDisabled();
});
```

ここでは、`getUserIdFromCookie`の部分は気にしないでください。認証は仮で作っています。

``` typescript
expect(screen.getByRole('button')).toBeDisabled();
```

の部分で、ログインページの中のボタン要素にアクセスして、ログインボタンの`disabled`プロパティが`true`になっていることを確認しています。
ちなみに、ボタン要素がページ内に複数あるときは、

``` typescript
expect(screen.getByRole('button', { name: /ログイン/ })).toBeDisabled();
```

として、表示されているボタンの文言でどのボタンかを絞り込むことができます。
ちなみに以下のAとBでは、ボタン要素がなかった場合に、同じようにテストがコケます。

``` typescript
  A: expect(screen.getByRole('button')).toBeInTheDocument();
  B: screen.getByRole('button')
```

ここでは何を確かめたいのかわかりやすくするために、敢えてAの長い方の書き方を採用しています。ただ、「getByがgetできなかったときはエラーを吐く」ということは大事で後の話につながってきます。
さらに書いていきます。

``` typescript
import userEvent from '@testing-library/user-event';
import { render, waitFor, screen, getByRole, getByLabelText } from '../../test-utils';
import { Login } from './Login';
import { getUserIdFromCookie } from '../../helpers/misc/cookie';

const input = {
  email: "test.user@gmail.com",
  password: 'xxxxXXXX',
};

const inputWrongPattern = {
  password: 'xxxx',
};


test('ログインページのテスト', () => {
  render(<Login />);

  // ユーザーは、ログインしていない
  expect(getUserIdFromCookie()).toBeUndefined();

  // ログインボタンは押せない状態になっている
  expect(screen.getByRole('button')).toBeDisabled();

  // フォームをすべて入力するとログインボタンは押せる状態になる
  userEvent.type(screen.getByLabelText(/Eメールアドレス/), input.email);
  userEvent.type(screen.getByLabelText(/パスワード/), inputWrongPattern.password);
  await waitFor(() => expect(screen.getByRole('button')).toBeEnabled());
});
```

label要素の文言を元に、input要素を取得し、input要素に対してvalueをテストしています。
また、(ここがまだちょっとよくわかっていないところなのですが)、stateの更新によって再描画が走る場合にはwaitForを使って待ってあげないとエラーが起こるようです。
最後まで書いていきます。

``` typescript
test('ログインページのテスト', () => {
  render(<Login />);

  ...省略...

  // 入力が適切だとエラーが表示されず、ログインできる
  userEvent.clear(screen.getByLabelText(/パスワード/);
  userEvent.type(screen.getByLabelText(/パスワード/, input.password);
  await waitFor(() => expect(screen.byText(/[0-9]文字以上で入力してください/)).not.toBeInTheDocument());
  expect(screen.getByLabelText(/パスワード/).toBeValid();
  userEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(getUserIdFromCookie()).toBeDefined());
});
```

長くなってきましたが、ポイントは以下の箇所です。

``` typescript
  expect(screen.queryByText(/[0-9]文字以上で入力してください/)).not.toBeInTheDocument());
```

ここでは`getBy`ではなく、`queryBy`のセレクタを使っています。
先ほど書いたように`getBy`はgetできなかったときはエラーを吐くため、`getBy`を使うと`screen.getByText(/[0-9]文字以上で入力してください/)`の部分ですでにテストが失敗するため、エラーメッセージが無いということが確かめられません。
そのため、取得する要素が存在しなくてもエラーを吐かない`queryBy`の方を使っています。

さて、改めてここまでのコードを読むと、

``` typescript
screen.getByRole('button')
screen.getByText(/[0-9]文字以上で入力してください/)
screen.getByLabelText(/パスワード/)
```

などの部分が、3回も4回も出てきて非常に読みづらい感じがします。
`testing-library-selector`を使って綺麗にしていきます。

``` shell
yarn add -D testing-library-selector
```

``` typescript
import userEvent from '@testing-library/user-event';
import { byText, byRole, byLabelText } from 'testing-library-selector';
import { testUser } from '../../tests/data/testUser';
import { render, waitFor } from '../../test-utils';
import { Login } from './Login';
import { getUserIdFromCookie } from '../../helpers/misc/cookie';

const input = {
  email: testUser.email,
  password: 'xxxxXXXX',
};

const inputWrongPattern = {
  password: 'xxxx',
};

const ui = {
  loginButton: byRole('button', { name: /ログイン/ }),
  emailInputField: byLabelText(/Eメールアドレス/),
  passwordInputField: byLabelText(/パスワード/),
  passwordErrorMinChar: byText(/[0-9]文字以上で入力してください/),
};

test('ログインページのテスト', async () => {
  render(<Login />);

  // ユーザーは、ログインしていない
  expect(getUserIdFromCookie()).toBeUndefined();

  // ログインボタンは押せない状態になっている
  expect(ui.loginButton.get()).toBeDisabled();

  // フォームをすべて入力するとログインボタンは押せる状態になる
  userEvent.type(ui.emailInputField.get(), input.email);
  userEvent.type(ui.passwordInputField.get(), inputWrongPattern.password);
  await waitFor(() => expect(ui.loginButton.get()).toBeEnabled());

  // 入力が適切でないとエラーが表示され、ログインできない
  userEvent.click(ui.loginButton.get());
  await waitFor(() => expect(ui.passwordErrorMinChar.get()).toBeInTheDocument());
  expect(ui.passwordInputField.get()).toBeInvalid();
  expect(getUserIdFromCookie()).toBeUndefined();

  // 入力が適切だとエラーが表示されず、ログインできる
  userEvent.clear(ui.passwordInputField.get());
  userEvent.type(ui.passwordInputField.get(), input.password);
  await waitFor(() => expect(ui.passwordErrorMinChar.query()).not.toBeInTheDocument());
  expect(ui.passwordInputField.get()).toBeValid();
  userEvent.click(ui.loginButton.get());
  await waitFor(() => expect(getUserIdFromCookie()).toBeDefined());
});
```

かなりスッキリしました！

## プロフィールページのテスト

ログインページと同じようにプロフィールページのテストも書いていきます。

``` typescript: Profile.test.tsx
import userEvent from '@testing-library/user-event';
import { byTestId, byText, byRole, byLabelText } from 'testing-library-selector';
import { rest } from 'msw';
import { server } from '../../tests/handlers/server';
import { render, waitFor } from '../../test-utils';
import { Profile } from './Profile';
import axios from 'axios'

const testUser = {
  id: 'abc-123',
  name: '橋本',
  profile: '橋本です。',
};

const newTestUser = {
  id: 'abc-123',
  name: '橋本太郎',
  profile: '橋本病院で働いています。',
};

const newTestUserWrongPattern = {
  profile:
    '橋本病院で働いています。Anim esse sit nulla ut fugiat deserunt nulla fugiat.Esse consequat eu aliquip irure non dolor culpa proident eu. Commodo pariatur sunt enim enim ipsum veniam est laborum eiusmod Lorem in excepteur. Nostrud velit dolore nulla irure eu labore nulla occaecat sint eu aliquip eu aliqua. Aute minim nisi anim occaecat aliqua nulla. Reprehenderit veniam ut cillum ad deserunt cupidatat commodo anim enim eu. Laborum ex irure Lorem labore laborum adipisicing dolor eiusmod incididunt culpa deserunt ea. Consequat enim enim dolor id elit irure incididunt sunt quis exercitation nisi deserunt exercitation ea.',
};

const ui = {
  skelton: byTestId(/skeleton/i),
  pageTitle: byText(/プロフィール/i),
  editDialog: byRole('dialog'),
  editButton: byRole('button', { name: /編集/ }),
  saveButton: byRole('button', { name: /保存/ }),
  cancelButton: byRole('button', { name: /キャンセル/ }),
  currentUserName: byText(new RegExp(testUser.name)),
  currentUserProfile: byText(new RegExp(testUser.profile)),
  newUserName: byText(new RegExp(newTestUser.name)),
  newUserProfile: byText(new RegExp(newTestUser.profile)),
  nameInputField: byLabelText(/名前/),
  profileInputField: byLabelText(/自己紹介/),
  profileErrorMaxChar: byText(/[0-9]文字以下で入力してください/),
  successMessage: byText(/変更しました/),
  errorMessage: byText(/エラーが発生しました/),
};

test('ユーザーはプロフィールを更新することができる', async () => {
  const spyFetch = jest.spyOn(axios, 'get');
  const spyUpdate = jest.spyOn(axios, 'post');
  document.cookie = `userId=${testUser.id}`;

  render(<Profile />);

  // プロフィールページの表示を待機する
  expect(spyFetch).toHaveBeenCalledTimes(1);
  expect(ui.skelton.get()).toBeInTheDocument();
  await waitFor(() => expect(ui.skelton.query()).not.toBeInTheDocument());

  // プロフィールページが表示される
  expect(ui.pageTitle.get()).toBeInTheDocument();

  // 現在の名前と自己紹介が表示される
  expect(ui.currentUserName.get()).toBeInTheDocument();
  expect(ui.currentUserProfile.get()).toBeInTheDocument();

  // ダイアログが閉じている
  expect(ui.editDialog.query()).not.toBeInTheDocument();

  // 編集ボタンを押す編集ダイアログが開く
  userEvent.click(ui.editButton.get());
  await waitFor(() => expect(ui.editDialog.get()).toBeInTheDocument());

  // 保存ボタンは押せない状態になっている
  expect(ui.saveButton.get()).toBeDisabled();

  // フォームには予め現在のプロフィール情報が入力されている
  expect(ui.nameInputField.get()).toHaveValue(testUser.name);
  expect(ui.profileInputField.get()).toHaveValue(testUser.profile);

  // キャンセルボタンを押すとダイアログが閉じる
  userEvent.click(ui.cancelButton.get());
  await waitFor(() => expect(ui.editDialog.query()).not.toBeInTheDocument());

  // フォームに新しいプロフィール情報を入力すると保存ボタンは押せる状態になる
  userEvent.click(ui.editButton.get());
  userEvent.clear(ui.nameInputField.get());
  userEvent.type(ui.nameInputField.get(), newTestUser.name);
  await waitFor(() => expect(ui.saveButton.get()).toBeEnabled());

  // 入力が適切でないとエラーが表示され、プロフィール情報が更新されない
  userEvent.type(ui.profileInputField.get(), newTestUserWrongPattern.profile);
  userEvent.click(ui.saveButton.get());
  await waitFor(() => expect(spyUpdate).toHaveBeenCalledTimes(0));
  await waitFor(() => expect(ui.profileErrorMaxChar.get()).toBeInTheDocument());
  expect(ui.profileInputField.get()).toBeInvalid();

  // 入力が適切だとエラーが表示されず、プロフィール情報が更新される
  userEvent.clear(ui.profileInputField.get());
  userEvent.type(ui.profileInputField.get(), newTestUser.profile);
  await waitFor(() => expect(ui.profileErrorMaxChar.query()).not.toBeInTheDocument());
  expect(ui.profileInputField.get()).toBeValid();
  userEvent.click(ui.saveButton.get());
  await waitFor(() => expect(spyUpdate).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(ui.successMessage.get()).toBeInTheDocument());

  // 更新後のプロフィール情報が表示される
  await waitFor(() => expect(spyFetch).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(ui.newUserName.get()).toBeInTheDocument());
  expect(ui.newUserName.get()).toBeInTheDocument();
  expect(ui.newUserProfile.get()).toBeInTheDocument();
});

test('読み込みエラーが起きたらエラー画面を表示する', async () => {
  render(<Profile />);
  server.use(rest.get(`${process.env.REACT_APP_API_END_POINT}/profile`, (_, res, ctx) => res(ctx.status(500))));

  // 意図的に引き起こすエラーの出力を無視する
  const spy = jest.spyOn(console, 'error');
  spy.mockImplementation(() => {});
  await waitFor(() => expect(ui.errorMessage.get()).toBeInTheDocument());
  spy.mockRestore();
});

test('更新エラーが起きたらエラー画面を表示する', async () => {
  render(<Profile />);
  server.use(rest.post(`${process.env.REACT_APP_API_END_POINT}/profile`, (_, res, ctx) => res(ctx.status(500))));

  userEvent.click(ui.editButton.get());
  userEvent.type(ui.profileInputField.get(), newTestUser.profile);
  userEvent.type(ui.nameInputField.get(), newTestUser.name);
  userEvent.click(ui.saveButton.get());

  // 意図的に引き起こすエラーの出力を無視する
  const spy = jest.spyOn(console, 'error');
  spy.mockImplementation(() => {});
  await waitFor(() => expect(ui.errorMessage.get()).toBeInTheDocument());
  spy.mockRestore();
});
```

ここでのログインページとの違いは、APIを呼ぶ処理が絡む点です。

``` typescript
  const spyFetch = jest.spyOn(axios, 'get');
  const spyUpdate = jest.spyOn(axios, 'post');
```

として、APIとのやりとりを監視しておいて、

``` typescript
await waitFor(() => expect(spyUpdate).toHaveBeenCalledTimes(1));
```

とすると、APIとのやりとりができていることが確認できます。
非同期処理なのでもちろん`await`が必要です。

また、エラーが起きたケースのテストのために、

``` typescript
 server.use(rest.post(`${process.env.REACT_APP_API_END_POINT}/profile`, (_, res, ctx) => res(ctx.status(500))));
```

として、APIのやりとりが失敗するように細工しています。

``` typescript
  const spy = jest.spyOn(console, 'error');
  spy.mockImplementation(() => {});
  ...
  spy.mockRestore();
```

この3行はコンソールへのわざと出したエラーの出力を省き、テストの結果を読みやすくしています。

fetchを使う場合は、ちょっと面倒くさいですが、以下のzennの本で丁寧に解説されていました。
[React テスト応用、テストに悩む人へ](https://zenn.dev/tkdn/books/react-testing-patterns)

# Jest

今までのところでReactTestingLibraryを使って、ざっくりとしたログインページのテストが書けました。
しかし、まだバリデーションのロジックの細かい部分に少し不安が残ります。
例えばパスワードのバリデーションに使っている正規表現は、想定通りの動きをしているでしょうか？
次はその辺りをテストしていきます。

このままReactTestingLibraryを使ってテストしても良いのですが、細かい部分をテストするにはReactTestingLibraryよりJestの方が適しています。やはりUIの絡まないロジック部分の検証には、実行速度の速いJestを使っていきたいです。
テストを書いていきます。

ログインのバリデーションのスキーマは以下のようにyupを使って書かれています。

``` typescript: loginSchema.ts
import * as yup from 'yup';

export interface LoginFormValues {
  email: string;
  password: string;
}

export const loginSchema: SchemaOf<LoginFormValues> = yup.object().shape({
  email: yup.string().email().required(),
  password: yup
    .string()
    .min(8)
    .matches(/^(?=.*?[a-z])(?=.*?[A-Z])/)
    .required(),
});
```

これを検証します。

```typescript: loginSchema.test.ts
import cases from 'jest-in-case';
import { loginSchema } from './loginSchema';

test('正常', async () => {
  expect(await loginSchema.isValid({ email: 'tanabe.akira@gmail.com', password: 'XXXXXXXX' })).toEqual(
    true,
  );
});

test('異常(@がない)', async () => {
  expect(await loginSchema.isValid({ email: 'tanabe.akira.co.jp', password: 'XXXXXXXX' })).toEqual(
    true,
  );
});
```

このまま書いていってもいいのですが、見通しが悪くなりそうなのでatlassianの`jest-in-case`を使うのがおすすめです。

```shell
yarn add -D jest-in-case
```

```typescript: loginForm.ts
import cases from 'jest-in-case';
import { loginSchema } from './useLoginForm';

interface Opts {
  name: string;
  input: {
    email: string;
    password: string;
  };
  result: boolean;
}

const validInput = {
  email: 'tanabe.akira@gmail.co.jp',
  password: 'xxxxXXXX',
};

cases(
  'ログインのバリデーションスキーマのテスト',
  async (opts: Opts) => {
    expect(await loginSchema.isValid(opts.input)).toEqual(opts.result);
  },
  [
    {
      name: '正常',
      input: { email: validInput.email, password: validInput.password },
      result: true,
    },
    // Eメールアドレスの間違い
    {
      name: '異常(@がない)',
      input: {
        email: 'tanabe.akira.co.jp',
        password: validInput.password,
      },
      result: false,
    },
    // パスワードの間違い
    {
      name: '異常(パスワードが8文字未満)',
      input: { email: validInput.email, password: 'xxxxXXX' },
      result: false,
    },
    {
      name: '異常(大文字と小文字の混合でない-大文字のみ)',
      input: { email: validInput.email, password: 'XXXXXXXX' },
      result: false,
    },
    {
      name: '異常(大文字と小文字の混合でない-小文字のみ)',
      input: { email: validInput.email, password: 'xxxxxxxx' },
      result: false,
    },
  ],
);
```

ちょっとスッキリしました！

## まとめ

JestとReactTestingLibraryを使ってテストを書いていきました。
何をテストするかによってJestとReactTestingLibraryを使い分けていくと、より快適になります。
長くなってしまったので、ユーザー一覧ページのテストは省略しましたが、コードは[こちら](https://github.com/t-keshi/react-test-lion)に置いてあります。
最後までお読みいただきました。

## 参考

以下はめちゃくちゃ参考になりました。書いてくださった方、ありがとうございます。
[React テスト応用、テストに悩む人へ](https://zenn.dev/tkdn/books/react-testing-patterns)
[React Testing Libraryの使い方](https://qiita.com/ossan-engineer/items/4757d7457fafd44d2d2f)
