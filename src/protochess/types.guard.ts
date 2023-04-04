/*
 * Generated type guards for "types.ts".
 * WARNING: Do not manually change this file.
 */
import type { MakeMoveResult, MoveInfo, MoveList, StateDiff, InitialState, GameState, Variant, PublishedVariant, PieceDefinition, GetBestMoveResult, GetBestMoveTimeoutResult } from "./types";

export function isMakeMoveResult(obj: unknown): obj is MakeMoveResult {
    const typedObj = obj as MakeMoveResult
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["flag"] === "Ok" ||
            typedObj["flag"] === "IllegalMove" ||
            typedObj["flag"] === "Checkmate" ||
            typedObj["flag"] === "LeaderCaptured" ||
            typedObj["flag"] === "AllPiecesCaptured" ||
            typedObj["flag"] === "PieceInWinSquare" ||
            typedObj["flag"] === "CheckLimit" ||
            typedObj["flag"] === "Stalemate" ||
            typedObj["flag"] === "Repetition") &&
        (typedObj["winner"] === "white" ||
            typedObj["winner"] === "black" ||
            typedObj["winner"] === "none") &&
        Array.isArray(typedObj["exploded"]) &&
        typedObj["exploded"].every((e: any) =>
            Array.isArray(e) &&
            typeof e[0] === "number" &&
            typeof e[1] === "number"
        )
    )
}

export function isMoveInfo(obj: unknown): obj is MoveInfo {
    const typedObj = obj as MoveInfo
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Array.isArray(typedObj["from"]) &&
        typeof typedObj["from"][0] === "number" &&
        typeof typedObj["from"][1] === "number" &&
        Array.isArray(typedObj["to"]) &&
        typeof typedObj["to"][0] === "number" &&
        typeof typedObj["to"][1] === "number" &&
        (typeof typedObj["promotion"] === "undefined" ||
            typeof typedObj["promotion"] === "string")
    )
}

export function isMoveList(obj: unknown): obj is MoveList {
    const typedObj = obj as MoveList
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["x"] === "number" &&
        typeof typedObj["y"] === "number" &&
        Array.isArray(typedObj["moves"]) &&
        typedObj["moves"].every((e: any) =>
            isMoveInfo(e) as boolean
        )
    )
}

export function isStateDiff(obj: unknown): obj is StateDiff {
    const typedObj = obj as StateDiff
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["fen"] === "string" &&
        typeof typedObj["inCheck"] === "boolean" &&
        (typedObj["playerToMove"] === 0 ||
            typedObj["playerToMove"] === 1)
    )
}

export function isInitialState(obj: unknown): obj is InitialState {
    const typedObj = obj as InitialState
    return (
        isStateDiff(typedObj) as boolean &&
        Array.isArray(typedObj["pieceTypes"]) &&
        typedObj["pieceTypes"].every((e: any) =>
            isPieceDefinition(e) as boolean
        ) &&
        typeof typedObj["boardWidth"] === "number" &&
        typeof typedObj["boardHeight"] === "number" &&
        Array.isArray(typedObj["invalidSquares"]) &&
        typedObj["invalidSquares"].every((e: any) =>
            Array.isArray(e) &&
            typeof e[0] === "number" &&
            typeof e[1] === "number"
        ) &&
        (typedObj["globalRules"] !== null &&
            typeof typedObj["globalRules"] === "object" ||
            typeof typedObj["globalRules"] === "function") &&
        typeof typedObj["globalRules"]["capturingIsForced"] === "boolean" &&
        typeof typedObj["globalRules"]["checkIsForbidden"] === "boolean" &&
        typeof typedObj["globalRules"]["stalematedPlayerLoses"] === "boolean" &&
        typeof typedObj["globalRules"]["invertWinConditions"] === "boolean" &&
        typeof typedObj["globalRules"]["repetitionsDraw"] === "number" &&
        typeof typedObj["globalRules"]["checksToLose"] === "number"
    )
}

export function isGameState(obj: unknown): obj is GameState {
    const typedObj = obj as GameState
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isInitialState(typedObj["initialState"]) as boolean &&
        (typeof typedObj["initialFen"] === "undefined" ||
            typeof typedObj["initialFen"] === "string") &&
        Array.isArray(typedObj["moveHistory"]) &&
        typedObj["moveHistory"].every((e: any) =>
            isMoveInfo(e) as boolean
        )
    )
}

export function isVariant(obj: unknown): obj is Variant {
    const typedObj = obj as Variant
    return (
        isInitialState(typedObj) as boolean &&
        Array.isArray(typedObj["pieceTypes"]) &&
        typedObj["pieceTypes"].every((e: any) =>
            isPieceDefinition(e) as boolean &&
            typeof e["displayName"] === "string" &&
            Array.isArray(e["imageUrls"]) &&
            (typeof e["imageUrls"][0] === "undefined" ||
                e["imageUrls"][0] === null ||
                typeof e["imageUrls"][0] === "string") &&
            (typeof e["imageUrls"][1] === "undefined" ||
                e["imageUrls"][1] === null ||
                typeof e["imageUrls"][1] === "string")
        ) &&
        typeof typedObj["displayName"] === "string" &&
        typeof typedObj["description"] === "string"
    )
}

export function isPublishedVariant(obj: unknown): obj is PublishedVariant {
    const typedObj = obj as PublishedVariant
    return (
        isVariant(typedObj) as boolean &&
        typeof typedObj["uid"] === "string" &&
        typedObj["creationTime"] instanceof Date &&
        typeof typedObj["creatorDisplayName"] === "string" &&
        (typeof typedObj["creatorId"] === "undefined" ||
            typeof typedObj["creatorId"] === "string") &&
        typeof typedObj["numUpvotes"] === "number" &&
        typeof typedObj["loggedUserUpvoted"] === "boolean"
    )
}

export function isPieceDefinition(obj: unknown): obj is PieceDefinition {
    const typedObj = obj as PieceDefinition
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Array.isArray(typedObj["ids"]) &&
        (typeof typedObj["ids"][0] === "undefined" ||
            typedObj["ids"][0] === null ||
            typeof typedObj["ids"][0] === "string") &&
        (typeof typedObj["ids"][1] === "undefined" ||
            typedObj["ids"][1] === null ||
            typeof typedObj["ids"][1] === "string") &&
        typeof typedObj["isLeader"] === "boolean" &&
        (typeof typedObj["castleFiles"] === "undefined" ||
            Array.isArray(typedObj["castleFiles"]) &&
            typeof typedObj["castleFiles"][0] === "number" &&
            typeof typedObj["castleFiles"][1] === "number") &&
        typeof typedObj["isCastleRook"] === "boolean" &&
        typeof typedObj["explodes"] === "boolean" &&
        Array.isArray(typedObj["explosionDeltas"]) &&
        typedObj["explosionDeltas"].every((e: any) =>
            Array.isArray(e) &&
            typeof e[0] === "number" &&
            typeof e[1] === "number"
        ) &&
        typeof typedObj["immuneToExplosion"] === "boolean" &&
        Array.isArray(typedObj["promotionSquares"]) &&
        typedObj["promotionSquares"].every((e: any) =>
            Array.isArray(e) &&
            typeof e[0] === "number" &&
            typeof e[1] === "number"
        ) &&
        Array.isArray(typedObj["promoVals"]) &&
        Array.isArray(typedObj["promoVals"][0]) &&
        typedObj["promoVals"][0].every((e: any) =>
            typeof e === "string"
        ) &&
        Array.isArray(typedObj["promoVals"][1]) &&
        typedObj["promoVals"][1].every((e: any) =>
            typeof e === "string"
        ) &&
        Array.isArray(typedObj["doubleJumpSquares"]) &&
        typedObj["doubleJumpSquares"].every((e: any) =>
            Array.isArray(e) &&
            typeof e[0] === "number" &&
            typeof e[1] === "number"
        ) &&
        Array.isArray(typedObj["attackSlidingDeltas"]) &&
        typedObj["attackSlidingDeltas"].every((e: any) =>
            Array.isArray(e) &&
            e.every((e: any) =>
                Array.isArray(e) &&
                typeof e[0] === "number" &&
                typeof e[1] === "number"
            )
        ) &&
        Array.isArray(typedObj["attackJumpDeltas"]) &&
        typedObj["attackJumpDeltas"].every((e: any) =>
            Array.isArray(e) &&
            typeof e[0] === "number" &&
            typeof e[1] === "number"
        ) &&
        typeof typedObj["attackNorth"] === "boolean" &&
        typeof typedObj["attackSouth"] === "boolean" &&
        typeof typedObj["attackEast"] === "boolean" &&
        typeof typedObj["attackWest"] === "boolean" &&
        typeof typedObj["attackNortheast"] === "boolean" &&
        typeof typedObj["attackNorthwest"] === "boolean" &&
        typeof typedObj["attackSoutheast"] === "boolean" &&
        typeof typedObj["attackSouthwest"] === "boolean" &&
        Array.isArray(typedObj["translateJumpDeltas"]) &&
        typedObj["translateJumpDeltas"].every((e: any) =>
            Array.isArray(e) &&
            typeof e[0] === "number" &&
            typeof e[1] === "number"
        ) &&
        Array.isArray(typedObj["translateSlidingDeltas"]) &&
        typedObj["translateSlidingDeltas"].every((e: any) =>
            Array.isArray(e) &&
            e.every((e: any) =>
                Array.isArray(e) &&
                typeof e[0] === "number" &&
                typeof e[1] === "number"
            )
        ) &&
        typeof typedObj["translateNorth"] === "boolean" &&
        typeof typedObj["translateSouth"] === "boolean" &&
        typeof typedObj["translateEast"] === "boolean" &&
        typeof typedObj["translateWest"] === "boolean" &&
        typeof typedObj["translateNortheast"] === "boolean" &&
        typeof typedObj["translateNorthwest"] === "boolean" &&
        typeof typedObj["translateSoutheast"] === "boolean" &&
        typeof typedObj["translateSouthwest"] === "boolean" &&
        Array.isArray(typedObj["winSquares"]) &&
        typedObj["winSquares"].every((e: any) =>
            Array.isArray(e) &&
            typeof e[0] === "number" &&
            typeof e[1] === "number"
        )
    )
}

export function isGetBestMoveResult(obj: unknown): obj is GetBestMoveResult {
    const typedObj = obj as GetBestMoveResult
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isMoveInfo(typedObj["moveInfo"]) as boolean &&
        typeof typedObj["evaluation"] === "number"
    )
}

export function isGetBestMoveTimeoutResult(obj: unknown): obj is GetBestMoveTimeoutResult {
    const typedObj = obj as GetBestMoveTimeoutResult
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isMoveInfo(typedObj["moveInfo"]) as boolean &&
        typeof typedObj["evaluation"] === "number" &&
        typeof typedObj["depth"] === "number"
    )
}
