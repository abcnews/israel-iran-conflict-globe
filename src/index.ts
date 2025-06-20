import { whenOdysseyLoaded } from '@abcnews/env-utils';
import App from './components/App/App.svelte';
import { loadScrollyteller } from '@abcnews/svelte-scrollyteller';
import { proxy } from '@abcnews/dev-proxy';

Promise.all([whenOdysseyLoaded, proxy('israel-iran-conflict-globe')]).then(() => {
  const scrollyData = loadScrollyteller(
    'one', // If set to eg. "one" use #scrollytellerNAMEone in CoreMedia
    'u-full', // Class to apply to mount point u-full makes it full width in Odyssey
    'mark' // Name of marker in CoreMedia eg. for "point" use #point default: #mark
  );

  const appMountEl = scrollyData.mountNode;

  appMountEl.classList.add('interactive-globe');

  // HACK TO FIX VIEWPORT BUG
  let viewPortTag = document.createElement('meta');
  viewPortTag.id = 'viewport';
  viewPortTag.name = 'viewport';
  viewPortTag.content = 'width=device-width, minimum-scale=1.0';
  document.getElementsByTagName('head')[0].appendChild(viewPortTag);

  if (appMountEl) {
    new App({
      target: appMountEl,
      props: { scrollyData }
    });
  }
});

if (process.env.NODE_ENV === 'development') {
  console.debug(`[Interactive Globe] public path: ${__webpack_public_path__}`);
}
