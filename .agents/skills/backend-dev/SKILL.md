---
name: backend-dev
description: Ruby on RailsでModel、Controller、routes、DB、認証・認可などのバックエンド機能を新規実装・変更するときに使用する。
---

# Railsバックエンド開発

## 基本方針

このプロジェクトではRuby on Railsの標準的な設計を優先する。

過剰な抽象化や不要なライブラリ追加を避け、
Rails標準機能で実現できる場合はそれを優先する。


## 作業開始前

実装・変更を行う前に以下を確認する。

1. 関連する要件
2. 既存のModel
3. 既存のController
4. `config/routes.rb`
5. DB schemaと関連migration
6. 関連するテスト
7. 認証・認可への影響

既存機能への影響範囲を確認してから実装を開始すること。


## Model

Modelは原則として以下に配置する。

`app/models/`

Modelでは主に以下を扱う。

- Active RecordによるDB操作
- association
- validation
- scope
- データに関するビジネスルール

例:

```ruby
class User < ApplicationRecord
  has_many :posts, dependent: :destroy

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
end