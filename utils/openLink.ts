import * as WebBrowser from 'expo-web-browser';

export async function openLink(url: string) {
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    controlsColor: '#000000',
  });
}