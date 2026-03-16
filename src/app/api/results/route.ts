import { NextResponse } from "next/server";
import { getDataSource } from "../../../lib/database";
import { GameResult } from "../../../entities/GameResult";

export async function GET() {
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(GameResult);
    const results = await repo.find({
      order: { playedAt: "DESC" },
      take: 20,
    });
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { winner } = body;

    if (!winner || !["X", "O", "Draw"].includes(winner)) {
      return NextResponse.json(
        { error: "Invalid winner value" },
        { status: 400 }
      );
    }

    const ds = await getDataSource();
    const repo = ds.getRepository(GameResult);

    const gameResult = new GameResult();
    gameResult.winner = winner;

    const saved = await repo.save(gameResult);
    return NextResponse.json({ result: saved }, { status: 201 });
  } catch (error) {
    console.error("Error saving result:", error);
    return NextResponse.json(
      { error: "Failed to save result" },
      { status: 500 }
    );
  }
}
