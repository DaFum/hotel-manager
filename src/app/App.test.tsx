import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App',()=>{it('renders the hotel manager shell',()=>{render(<App/>);expect(screen.getByRole('main',{name:'Hotel Manager'})).toBeTruthy();});});
