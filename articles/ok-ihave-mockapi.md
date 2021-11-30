---
title: 'まだAPIが出来ていない？私は一向にかまわんッッ'
emoji: '😤'
type: 'tech'
topics: [React, TypeScript, MockServiceWorker]
published: true
---

初記事です。

# あるフロントエンドの悩み

プロジェクトの納期は決まっていて、すぐに着手しないといけない。
だけど、API はまだできていない...
早く着手したい...、ふぬぬ...。

今回はそんなフロントエンドがバックエンドのタスクの待ちにならないように、並行してアジャイルに開発していけるツールとして`msw`をご紹介します。

# mswとは？

mswとは`mock service worker`の略で、簡単にモックのAPIを立てることができるライブラリです。
同様のことができるライブラリとして`JSON Server`もありますが、mswには以下の利点があります。

- 単純にJSONを返すのではなく、ロジックも書くことができる
- Expressのようにスッキリ書くことができる
- RESTだけでなく、GraphQLにも対応している

以下のようなケースに向いていると思います。

- 早く着手しないといけないけど、API はまだできていない
- 要件がフワッとしているので、動くデモを作って仕様を固めたい
- テストに使うモックのデータが欲しい

## mswの使い方

まず`msw`のパッケージを追加し、セットアップします。

```shell
$yarn add -D msw
$npx msw init public/ --save
```

次に、ベースとなるファイルを配置します。

```typescript:worker.ts
const handlers = [
  rest.get('/', (req, res, ctx) => res(
    ctx.status(200),
    ctx.json({message: "hello, world!"})
  ))
]；

export const worker = setupWorker(...handlers);
```

```typescript:index.ts
import { worker } from '../mock/worker';

if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_SERVER === 'true') {
  void worker.start();
}
```

基本はこれだけです。
あとはお好きなHTTPクライアントでgetを投げれば、`{message: "hello, world!"}`が返ってきます。

これだけだとJSONファイル置いとけばええやんってなるかもしれないので、ロジックを少し足していきたいと思います。

### 例: ユーザー単体取得

例として、ユーザーの単体取得の MockAPI を実装します。

```typescript:mockData/users.ts
export const mockUsers = [
  {
    id: 1,
    name: '日本 太郎',
  },
  {
    id: 2,
    name: 'Pablo Diego José Francisco de Paula Juan Nepomuceno María de los Remedios Cipriano de la Santísima Trinidad Ruiz y Picasso',
  },
];
```

```typescript:mockApi/getUser.ts
import {
  ResponseResolver,
  RestContext,
  RestRequest,
  MockedResponse,
  DefaultRequestBody,
} from 'msw';
import { mockUsers } from './mockData/users';

export const getUser: ResponseResolver<
  RestRequest<DefaultRequestBody, { userId: string }>,
  RestContext,
> = (req, res, ctx) => {
  const user = mockUsers.find((mockUser) => mockUser.id === parseInt(req.params.userId, 10));
  return res(
    ctx.json({
      user,
    }),
  );
};
```

```typescript:worker.ts
import { getUser } from './mockApi/getUser';

export const handlers = [rest.get('/:userId', getUser)];
```

楽々ですね。
これで、例えばaxiosなら

```typescript
  const fetchUserWithAxios = async () => {
    const res: AxiosResponse<{id: number, name: string}> = await axios.get(`https://localhost:3000/${userId}`)

    return res.data;
  };
```

みたいに呼んであげたらOKです。

実際のAPIを叩いているかのように実装できるので、APIが仕上がったらエンドポイントを変えるだけで済みます。
下記のように環境変数を設定して、モックと実際のAPIを簡単に切り替えられるようにしておくと良いかもしれません。

```shell:.env
REACT_APP_USE_MOCK_SERVER = 'false'
REACT_APP_MOCK_API_ENDPOINT= 'https://localhost:3000'
REACT_APP_API_ENDPOINT = 'http://actual-api-endpoint'
```

```typescript
export const endpoint =
  process.env.REACT_APP_USE_MOCK_SERVER === 'true'
    ? process.env.REACT_APP_MOCK_API_ENDPOINT
    : process.env.REACT_APP_API_ENDPOINT;
```

## まとめ

いかがでしたでしょうか。
`msw`はサクッとモックAPIが作れて、アジャイルな開発には特に向いているライブラリです。
今回は省きましたが、`Storybook`と組み合わせるとさらに便利です。
デザインカンプの完成すら待つ必要がなくなり、フロントエンドがタスクの依存関係から解放されるかもしれません。
それについては別記事にしたいと思います。

最後までお付き合いいただき、ありがとうございました。

## 参考

- [msw](https://mswjs.io/)
- [Mock Service Worker で開発用のモックAPIを作る](https://zenn.dev/ryo_kawamata/articles/mock-api-server-with-msw)
- [MSW で加速するフロントエンド開発](https://zenn.dev/takepepe/articles/msw-driven-development)

`msw`をテストに使う利点と方法については以下も良記事なのでぜひ
[Stop mocking fetch](https://kentcdodds.com/blog/stop-mocking-fetch)xw

## (追記 2021/11/29) workerのimportについて

運用していくうちに気づいた点があったので、訂正させていただきます。
下記の部分についてですが、

```typescript:index.ts
import { worker } from '../mock/worker';

if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_SERVER === 'true') {
  void worker.start();
}
```

こうすると本番ビルドしたファイルの中に`msw`のコードが含まれてしまうので、

```typescript:index.ts
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_MOCK_SERVER === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, global-require, @typescript-eslint/no-var-requires
  const worker = require('./tests/handlers/worker');
  void (worker as { default: { start: () => void } }).default.start();
}
```

というようにして、if文の中でworkerをimportしてきた方が良さそうです。
失礼致しました🙇‍♂️
