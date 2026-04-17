import React, { createContext, useContext, useState } from 'react'

const BotLoadingContext = createContext()

export function BotLoadingProvider({ children }) {
  const [livebotLoading, setLivebotLoading] = useState(false)
  const [fabuBotLoading, setFabuBotLoading] = useState(false)

  return (
    <BotLoadingContext.Provider value={{
      livebotLoading,
      setLivebotLoading,
      fabuBotLoading,
      setFabuBotLoading
    }}>
      {children}
    </BotLoadingContext.Provider>
  )
}

export function useBotLoading() {
  return useContext(BotLoadingContext)
}
