import React, { Suspense } from 'react'
import NetWorth from './routes/net-worth/NetWorth'
import { I18nextProvider } from 'react-i18next'
import i18nInstance from './config/i18n.config'
import { type i18n } from 'i18next'
import { RootStore } from './store/rootStore'
import { StoreContext } from './context/store'
import { applySnapshot, getSnapshot, registerRootStore, onSnapshot } from 'mobx-keystone'
import Notifier from './components/Notifier/Notifier'
import { Toaster } from 'echo-common/components-v1'
import { initDrizzle, getRootSnapshot, saveRootSnapshot } from './db'
import _ from 'lodash'

export function createRootStore() {
  const rootStore = new RootStore({})
  registerRootStore(rootStore)

  initDrizzle().then(async () => {
    // TODO: Fix whitelist for keys
    const data = await getRootSnapshot()
    if (data) {
      applySnapshot(rootStore, data)
    }
    onSnapshot(rootStore, _.debounce(saveRootSnapshot, 500))
  })

  // we can also connect the store to the redux dev tools
  // const remotedev = require('remotedev')
  // const connection = remotedev.connectViaExtension({
  //   name: 'Test account'
  // })

  // connectReduxDevTools(remotedev, connection, rootStore)

  return rootStore
}

export const store = createRootStore()

// @ts-ignore
window.rootStore = store

const App = () => {
  return (
    <Suspense>
      <I18nextProvider i18n={i18nInstance as i18n}>
        <StoreContext.Provider value={store}>
          <NetWorth />
          <Notifier />
          <Toaster />
        </StoreContext.Provider>
      </I18nextProvider>
    </Suspense>
  )
}

export default App

/**
  Save / Restore the state of the store while self module is hot reloaded
*/
if (import.meta.hot) {
  if (import.meta.hot.data && import.meta.hot.data.store) {
    applySnapshot(store, import.meta.hot.data.store)
  }
  import.meta.hot.dispose((data) => {
    data.store = getSnapshot(store)
  })
}
