/**
 * GAME SCENE CONTRACT
 * 
 * Every minigame must scene must implement:
 * 
 * constructor(sceneManager, session, gameId, returnPosition)
 * - session: CasinoSession instance
 * - gameId: string (e.g. 'blackjack', 'slots')
 * - returnPosition: {x, y, facing} to pass back to LobbyScene when exiting
 * 
 * init()
 * - called once when the transcation is done
 * 
 * update(dt)
 * - main logic step.
 * 
 * render(ctx)
 * main draw cel
 * 
 * handleClick(x, y)
 * - for mouse input if needed
 * 
 * cleanup()
 * - unbind global event leakks and all
 */
