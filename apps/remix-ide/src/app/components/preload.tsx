import { RemixApp } from '@remix-ui/app'
import axios from 'axios'
import React, { useEffect, useRef, useState } from 'react'
import * as packageJson from '../../../../../package.json'
import { fileSystem, fileSystems } from '../files/fileSystem'
import { indexedDBFileSystem } from '../files/filesystems/indexedDB'
import { localStorageFS } from '../files/filesystems/localStorage'
import { fileSystemUtility, migrationTestData } from '../files/filesystems/fileSystemUtility'
import './styles/preload.css'
import isElectron from 'is-electron'
const _paq = (window._paq = window._paq || [])

export const Preload = (props: any) => {
  const [tip, setTip] = useState<string>('')
  const [supported, setSupported] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)
  const [showDownloader, setShowDownloader] = useState<boolean>(false)
  const remixFileSystems = useRef<fileSystems>(new fileSystems())
  const remixIndexedDB = useRef<fileSystem>(new indexedDBFileSystem())
  const localStorageFileSystem = useRef<fileSystem>(new localStorageFS())
  // url parameters to e2e test the fallbacks and error warnings
  const testmigrationFallback = useRef<boolean>(
    window.location.hash.includes('e2e_testmigration_fallback=true') && window.location.host === '127.0.0.1:8080' && window.location.protocol === 'http:'
  )
  const testmigrationResult = useRef<boolean>(
    window.location.hash.includes('e2e_testmigration=true') && window.location.host === '127.0.0.1:8080' && window.location.protocol === 'http:'
  )
  const testBlockStorage = useRef<boolean>(
    window.location.hash.includes('e2e_testblock_storage=true') && window.location.host === '127.0.0.1:8080' && window.location.protocol === 'http:'
  )

  function loadAppComponent() {
    import('../../app')
      .then((AppComponent) => {
        const appComponent = new AppComponent.default()
        appComponent.run().then(() => {
          props.root.render(<RemixApp app={appComponent} />)
        })
      })
      .catch((err) => {
        _paq.push(['trackEvent', 'Preload', 'error', err && err.message])
        console.error('Error loading CodeBox:', err)
        setError(true)
      })
  }

  const downloadBackup = async () => {
    setShowDownloader(false)
    const fsUtility = new fileSystemUtility()
    await fsUtility.downloadBackup(remixFileSystems.current.fileSystems['localstorage'])
    await migrateAndLoad()
  }

  const migrateAndLoad = async () => {
    setShowDownloader(false)
    const fsUtility = new fileSystemUtility()
    const migrationResult = await fsUtility.migrate(localStorageFileSystem.current, remixIndexedDB.current)
    _paq.push(['trackEvent', 'Migrate', 'result', migrationResult ? 'success' : 'fail'])
    await setFileSystems()
  }

  const setFileSystems = async () => {
    const fsLoaded = await remixFileSystems.current.setFileSystem([
      testmigrationFallback.current || testBlockStorage.current ? null : remixIndexedDB.current,
      testBlockStorage.current ? null : localStorageFileSystem.current
    ])
    if (fsLoaded) {
      console.log(fsLoaded.name + ' activated')
      _paq.push(['trackEvent', 'Storage', 'activate', fsLoaded.name])
      loadAppComponent()
    } else {
      _paq.push(['trackEvent', 'Storage', 'error', 'no supported storage'])
      setSupported(false)
    }
  }

  const testmigration = async () => {
    if (testmigrationResult.current) {
      const fsUtility = new fileSystemUtility()
      fsUtility.populateWorkspace(migrationTestData, remixFileSystems.current.fileSystems['localstorage'].fs)
    }
  }

  useEffect (() => {
    if (isElectron()){
      loadAppComponent()
      return
    }
    async function loadStorage() {
      ;(await remixFileSystems.current.addFileSystem(remixIndexedDB.current)) || _paq.push(['trackEvent', 'Storage', 'error', 'indexedDB not supported'])
      ;(await remixFileSystems.current.addFileSystem(localStorageFileSystem.current)) || _paq.push(['trackEvent', 'Storage', 'error', 'localstorage not supported'])
      await testmigration()
      remixIndexedDB.current.loaded && (await remixIndexedDB.current.checkWorkspaces())
      localStorageFileSystem.current.loaded && (await localStorageFileSystem.current.checkWorkspaces())
      remixIndexedDB.current.loaded && (remixIndexedDB.current.hasWorkSpaces || !localStorageFileSystem.current.hasWorkSpaces ? await setFileSystems() : setShowDownloader(true))
      !remixIndexedDB.current.loaded && (await setFileSystems())
    }
    loadStorage()

    const abortController = new AbortController()
    const signal = abortController.signal
    async function showRemixTips() {
      const response = await axios.get('https://raw.githubusercontent.com/remix-project-org/remix-dynamics/main/ide/tips.json', { signal })
      if (signal.aborted) return
      const tips = response.data
      const index = Math.floor(Math.random() * (tips.length - 1))
      setTip(tips[index])
    }
    try {
      showRemixTips()
    } catch (e) {
      console.log(e)
    }
    return () => {
      abortController.abort();
    };
  }, [])

  return (
    <>
      <div className="preload-container">
        <div className="mb-8 flex align-middle justify-center">
          {/* {logo} */}
          <div className="info-secondary splash">
            CodeBox IDE
            <br />
            <span className="version"> v{packageJson.version}</span>
          </div>
        </div>
        {!supported ? (
          <div className="preload-info-container alert alert-warning">
            Your browser does not support any of the filesystems required by CodeBox. Either change the settings in your browser or use a supported browser.
          </div>
        ) : null}
        {error ? (
          <div className="preload-info-container alert alert-danger text-left">
            An unknown error has occurred while loading the application.
            <br></br>
            Doing a hard refresh might fix this issue:<br></br>
            <div className="pt-2">
              Windows:<br></br>- Chrome: CTRL + F5 or CTRL + Reload Button
              <br></br>- Firefox: CTRL + SHIFT + R or CTRL + F5<br></br>
            </div>
            <div className="pt-2">
              MacOS:<br></br>- Chrome & FireFox: CMD + SHIFT + R or SHIFT + Reload Button<br></br>
            </div>
            <div className="pt-2">
              Linux:<br></br>- Chrome & FireFox: CTRL + SHIFT + R<br></br>
            </div>
          </div>
        ) : null}
        {showDownloader ? (
          <div className="preload-info-container alert alert-info">
            This app will be updated now. Please download a backup of your files now to make sure you don't lose your work.
            <br></br>
            You don't need to do anything else, your files will be available when the app loads.
            <div
              onClick={async () => {
                await downloadBackup()
              }}
              data-id="downloadbackup-btn"
              className="btn btn-primary mt-1"
            >
              download backup
            </div>
            <div
              onClick={async () => {
                await migrateAndLoad()
              }}
              data-id="skipbackup-btn"
              className="btn btn-primary mt-1"
            >
              skip backup
            </div>
          </div>
        ) : null}
        {supported && !error && !showDownloader ? (
          <div>
            <div className='text-center'>
              <i className="fas fa-spinner fa-spin fa-2x"></i>
            </div>
            { tip && <div className='remix_tips text-center mt-3'>
              <div><b>DID YOU KNOW</b></div>
              <span>{tip}</span>
            </div> }
          </div>
        ) : null}
      </div>
    </>
  )
}

const logo = (
  <svg width="50" height="50" viewBox="0 0 103 104" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.9676 89.2131C17.0572 89.3035 17.1578 89.3938 17.2473 89.4843L20.7816 84.4121C23.7121 78.5944 24.8529 73.2849 24.8864 68.7664C24.8417 66.3489 24.5061 63.954 23.9022 61.6269C23.4771 60.2262 23.164 58.7801 22.9626 57.3229C22.9626 57.3116 22.9626 57.2891 22.9626 57.2664C22.8284 56.2949 22.7389 55.3008 22.6943 54.3068C22.0791 38.2882 34.4046 24.5629 50.2199 23.6591L50.108 23.5575C53.8773 23.3202 59.3689 24.1562 63.9771 22.9362C68.753 21.5693 73.0926 18.9146 76.5375 15.2545C76.7052 15.0737 76.8955 14.9156 77.0967 14.78L80.3403 10.1371C66.7621 0.62546 48.8441 -1.98404 32.4026 4.80519C6.58822 15.4466 -5.78209 45.2243 4.76511 71.2968C7.40471 77.8149 11.2187 83.4858 15.8716 88.1513C16.2294 88.5128 16.5874 88.8629 16.9565 89.2131H16.9676Z" fill="url(#paint0_linear_351_435)" stroke="white" stroke-width="0.300037" stroke-miterlimit="10"/>
<path d="M82.7107 18.9597C82.6324 19.1969 82.5429 19.4454 82.4087 19.6713C79.3552 25.4438 78.0579 34.1648 78.3374 37.6103C78.7961 43.3376 80.5297 47.0542 79.9929 51.4373C80.3955 67.3316 68.0923 80.8309 52.4 81.7008C52.4 81.7008 52.3777 81.7008 52.3665 81.7008C48.9104 81.9268 48.5078 81.5879 45.3426 81.7346C38.8106 82.0283 31.8426 84.7847 27.0107 89.936L23.7783 94.5788C24.7067 95.2002 25.6462 95.7876 26.5969 96.3751C27.0331 96.6236 27.4693 96.8608 27.9056 97.098C40.6673 103.899 56.2029 105.152 70.5977 99.2105C96.412 88.5578 108.782 58.78 98.2351 32.7075C95.3494 25.5795 91.0433 19.4566 85.7865 14.554L82.7107 18.9597Z" fill="url(#paint1_linear_351_435)" stroke="white" stroke-width="0.300037" stroke-miterlimit="10"/>
<defs>
<linearGradient id="paint0_linear_351_435" x1="40.6702" y1="1" x2="40.6702" y2="89.4843" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="1" stop-color="white" stop-opacity="0.45"/>
</linearGradient>
<linearGradient id="paint1_linear_351_435" x1="62.8893" y1="14.554" x2="62.8893" y2="103.016" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.45"/>
<stop offset="1" stop-color="white"/>
</linearGradient>
</defs>
</svg>
)
