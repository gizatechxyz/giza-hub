import { GizaAuthProvider } from './provider';
import { getBaseUrl } from '../constants';

export const provider = new GizaAuthProvider(getBaseUrl());
