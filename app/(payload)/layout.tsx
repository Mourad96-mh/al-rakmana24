/* THIS FILE IS OWNED BY PAYLOAD — keep it in sync with the official template.
 * The (payload) route group owns its own <html>/<body>; that is why there is no
 * app/layout.tsx at the root of this project. */
import type { ServerFunctionClient } from 'payload'
import type { ReactNode } from 'react'
import config from '@payload-config'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import '@payloadcms/next/css'

import { importMap } from './admin/importMap.js'
import './custom.css'

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

export default function PayloadLayout({ children }: { children: ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
