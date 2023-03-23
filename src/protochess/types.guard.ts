/*
 * Generated type guards for "types.ts".
 * WARNING: Do not manually change this file.
 */
import type { GameState, GameStateGui, Variant, PublishedVariant, PublishedVariantGui, PieceDefinition } from './types'

export function isGameState(obj: unknown): obj is GameState {
    const typedObj = obj as GameState
    return (
        (typedObj !== null &&
            typeof typedObj === 'object' ||
            typeof typedObj === 'function') &&
        Array.isArray(typedObj['pieceTypes']) &&
        typedObj['pieceTypes'].every((e: any) =>
            isPieceDefinition(e) as boolean
        ) &&
        typeof typedObj['boardWidth'] === 'number' &&
        typeof typedObj['boardHeight'] === 'number' &&
        Array.isArray(typedObj['invalidSquares']) &&
        typedObj['invalidSquares'].every((e: any) =>
            Array.isArray(e) &&
            typeof e[0] === 'number' &&
            typeof e[1] === 'number'
        ) &&
        Array.isArray(typedObj['pieces']) &&
        typedObj['pieces'].every((e: any) =>
            (e !== null &&
                typeof e === 'object' ||
                typeof e === 'function') &&
            typeof e['pieceId'] === 'string' &&
            typeof e['x'] === 'number' &&
            typeof e['y'] === 'number' &&
            (typeof e['canCastle'] === 'undefined' ||
                e['canCastle'] === false ||
                e['canCastle'] === true)
        ) &&
        (typedObj['playerToMove'] === 0 ||
            typedObj['playerToMove'] === 1) &&
        (typeof typedObj['epSquareAndVictim'] === 'undefined' ||
            Array.isArray(typedObj['epSquareAndVictim']) &&
            Array.isArray(typedObj['epSquareAndVictim'][0]) &&
            typeof typedObj['epSquareAndVictim'][0][0] === 'number' &&
            typeof typedObj['epSquareAndVictim'][0][1] === 'number' &&
            Array.isArray(typedObj['epSquareAndVictim'][1]) &&
            typeof typedObj['epSquareAndVictim'][1][0] === 'number' &&
            typeof typedObj['epSquareAndVictim'][1][1] === 'number') &&
        (typeof typedObj['timesInCheck'] === 'undefined' ||
            Array.isArray(typedObj['timesInCheck']) &&
            typeof typedObj['timesInCheck'][0] === 'number' &&
            typeof typedObj['timesInCheck'][1] === 'number') &&
        (typedObj['globalRules'] !== null &&
            typeof typedObj['globalRules'] === 'object' ||
            typeof typedObj['globalRules'] === 'function') &&
        typeof typedObj['globalRules']['capturingIsForced'] === 'boolean' &&
        typeof typedObj['globalRules']['checkIsForbidden'] === 'boolean' &&
        typeof typedObj['globalRules']['stalematedPlayerLoses'] === 'boolean' &&
        typeof typedObj['globalRules']['invertWinConditions'] === 'boolean' &&
        typeof typedObj['globalRules']['repetitionsDraw'] === 'number' &&
        typeof typedObj['globalRules']['checksToLose'] === 'number'
    )
}

export function isGameStateGui(obj: unknown): obj is GameStateGui {
    const typedObj = obj as GameStateGui
    return (
        isGameState(typedObj) as boolean &&
        typeof typedObj['fen'] === 'string' &&
        typeof typedObj['inCheck'] === 'boolean'
    )
}

export function isVariant(obj: unknown): obj is Variant {
    const typedObj = obj as Variant
    return (
        isGameState(typedObj) as boolean &&
        typeof typedObj['displayName'] === 'string' &&
        typeof typedObj['description'] === 'string'
    )
}

export function isPublishedVariant(obj: unknown): obj is PublishedVariant {
    const typedObj = obj as PublishedVariant
    return (
        isVariant(typedObj) as boolean &&
        typeof typedObj['uid'] === 'string' &&
        typeof typedObj['creatorDisplayName'] === 'string' &&
        typeof typedObj['creatorId'] === 'string' &&
        typeof typedObj['numUpvotes'] === 'number' &&
        typeof typedObj['loggedUserUpvoted'] === 'boolean'
    )
}

export function isVariantGui(obj: unknown): obj is PublishedVariantGui {
    const typedObj = obj as PublishedVariantGui
    return (
        isPublishedVariant(typedObj) as boolean &&
        isGameStateGui(typedObj) as boolean
    )
}

export function isPieceDefinition(obj: unknown): obj is PieceDefinition {
    const typedObj = obj as PieceDefinition
    return (
        (typedObj !== null &&
            typeof typedObj === 'object' ||
            typeof typedObj === 'function') &&
        Array.isArray(typedObj['ids']) &&
        (typeof typedObj['ids'][0] === 'undefined' ||
            typedObj['ids'][0] === null ||
            typeof typedObj['ids'][0] === 'string') &&
        (typeof typedObj['ids'][1] === 'undefined' ||
            typedObj['ids'][1] === null ||
            typeof typedObj['ids'][1] === 'string') &&
        typeof typedObj['isLeader'] === 'boolean' &&
        (typeof typedObj['castleFiles'] === 'undefined' ||
            Array.isArray(typedObj['castleFiles']) &&
            typeof typedObj['castleFiles'][0] === 'number' &&
            typeof typedObj['castleFiles'][1] === 'number') &&
        typeof typedObj['isCastleRook'] === 'boolean' &&
        typeof typedObj['explodes'] === 'boolean' &&
        Array.isArray(typedObj['explosionDeltas']) &&
        typedObj['explosionDeltas'].every((e: any) =>
            Array.isArray(e) &&
            typeof e[0] === 'number' &&
            typeof e[1] === 'number'
        ) &&
        typeof typedObj['immuneToExplosion'] === 'boolean' &&
        Array.isArray(typedObj['promotionSquares']) &&
        typedObj['promotionSquares'].every((e: any) =>
            Array.isArray(e) &&
            typeof e[0] === 'number' &&
            typeof e[1] === 'number'
        ) &&
        Array.isArray(typedObj['promoVals']) &&
        Array.isArray(typedObj['promoVals'][0]) &&
        typedObj['promoVals'][0].every((e: any) =>
            typeof e === 'string'
        ) &&
        Array.isArray(typedObj['promoVals'][1]) &&
        typedObj['promoVals'][1].every((e: any) =>
            typeof e === 'string'
        ) &&
        Array.isArray(typedObj['doubleJumpSquares']) &&
        typedObj['doubleJumpSquares'].every((e: any) =>
            Array.isArray(e) &&
            typeof e[0] === 'number' &&
            typeof e[1] === 'number'
        ) &&
        Array.isArray(typedObj['attackSlidingDeltas']) &&
        typedObj['attackSlidingDeltas'].every((e: any) =>
            Array.isArray(e) &&
            e.every((e: any) =>
                Array.isArray(e) &&
                typeof e[0] === 'number' &&
                typeof e[1] === 'number'
            )
        ) &&
        Array.isArray(typedObj['attackJumpDeltas']) &&
        typedObj['attackJumpDeltas'].every((e: any) =>
            Array.isArray(e) &&
            typeof e[0] === 'number' &&
            typeof e[1] === 'number'
        ) &&
        typeof typedObj['attackNorth'] === 'boolean' &&
        typeof typedObj['attackSouth'] === 'boolean' &&
        typeof typedObj['attackEast'] === 'boolean' &&
        typeof typedObj['attackWest'] === 'boolean' &&
        typeof typedObj['attackNortheast'] === 'boolean' &&
        typeof typedObj['attackNorthwest'] === 'boolean' &&
        typeof typedObj['attackSoutheast'] === 'boolean' &&
        typeof typedObj['attackSouthwest'] === 'boolean' &&
        Array.isArray(typedObj['translateJumpDeltas']) &&
        typedObj['translateJumpDeltas'].every((e: any) =>
            Array.isArray(e) &&
            typeof e[0] === 'number' &&
            typeof e[1] === 'number'
        ) &&
        Array.isArray(typedObj['translateSlidingDeltas']) &&
        typedObj['translateSlidingDeltas'].every((e: any) =>
            Array.isArray(e) &&
            e.every((e: any) =>
                Array.isArray(e) &&
                typeof e[0] === 'number' &&
                typeof e[1] === 'number'
            )
        ) &&
        typeof typedObj['translateNorth'] === 'boolean' &&
        typeof typedObj['translateSouth'] === 'boolean' &&
        typeof typedObj['translateEast'] === 'boolean' &&
        typeof typedObj['translateWest'] === 'boolean' &&
        typeof typedObj['translateNortheast'] === 'boolean' &&
        typeof typedObj['translateNorthwest'] === 'boolean' &&
        typeof typedObj['translateSoutheast'] === 'boolean' &&
        typeof typedObj['translateSouthwest'] === 'boolean' &&
        Array.isArray(typedObj['winSquares']) &&
        typedObj['winSquares'].every((e: any) =>
            Array.isArray(e) &&
            typeof e[0] === 'number' &&
            typeof e[1] === 'number'
        ) &&
        typeof typedObj['displayName'] === 'string' &&
        Array.isArray(typedObj['imageUrls']) &&
        (typeof typedObj['imageUrls'][0] === 'undefined' ||
            typedObj['imageUrls'][0] === null ||
            typeof typedObj['imageUrls'][0] === 'string') &&
        (typeof typedObj['imageUrls'][1] === 'undefined' ||
            typedObj['imageUrls'][1] === null ||
            typeof typedObj['imageUrls'][1] === 'string')
    )
}
