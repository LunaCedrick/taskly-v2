import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { useStore } from '../src/store'
import { initialAuthState } from '../src/store/auth-slice'

beforeEach(() => useStore.setState({ ...initialAuthState, drawerOpen: false }))
afterEach(cleanup)
