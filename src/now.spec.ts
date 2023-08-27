import { Db, MongoClient } from "mongodb"

import { jest } from "@jest/globals"

let connection: MongoClient
let db: Db

jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] })

beforeAll(async () => {
  connection = await MongoClient.connect(globalThis.__MONGO_URI__)
  db = await connection.db(globalThis.__MONGO_DB_NAME__)
})

afterAll(async () => {
  await connection.close()
})

test("Demo $$NOW doesn't use mocked system time", async () => {
  const db = connection.db("test1")

  const mockedTime = new Date("2023-08-01T12:00:00.000Z")
  jest.setSystemTime(mockedTime)

  await db.collection("events").insertOne({
    now1: new Date(),
  })

  const result = (
    await db
      .collection("events")
      .aggregate([
        {
          $project: {
            _id: 0,
            now1: 1,
            now2: "$$NOW",
          },
        },
      ])
      .toArray()
  )[0]

  expect(result.now1).toEqual(mockedTime) // Passes
  expect(result.now2).toEqual(mockedTime) // Fails

  connection.close()
})
