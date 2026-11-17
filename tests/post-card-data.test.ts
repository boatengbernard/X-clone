import { isValidElement, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { formatCount, initialsOf, richText } from '../src/utils';

// Worst-case values from break-ui (src/data/worstCase.ts).
describe('initialsOf', () => {
  it('uses the first and last name and skips suffixes', () => {
    expect(initialsOf('Christopher Alexander Montgomery-Fitzwilliam III')).toBe('CM');
    expect(initialsOf('Abena Owusu')).toBe('AO');
  });
  it('never splits an emoji and skips emoji words', () => {
    expect(initialsOf('🦊 Fox')).toBe('F');
    expect(initialsOf('👩🏽‍💻 Priya Nair')).toBe('PN');
  });
  it('keeps accents, short names, CJK and odd spacing whole', () => {
    expect(initialsOf('Đặng Thị Ngọc Hân')).toBe('ĐH');
    expect(initialsOf('Jo')).toBe('J');
    expect(initialsOf('王秀英')).toBe('王');
    expect(initialsOf('  Sam   Lee ')).toBe('SL');
    expect(initialsOf('dana')).toBe('D');
  });
  it('falls back to the first character when there are no letters', () => {
    expect(initialsOf('🙏')).toBe('🙏');
  });
});

describe('formatCount', () => {
  it('is exact with separators below 10,000 and short above', () => {
    expect(formatCount(1)).toBe('1');
    expect(formatCount(1284)).toBe((1284).toLocaleString());
    expect(formatCount(10_032)).toMatch(/^10(\.0)?\s?K$/i);
  });
});

const links = (text: string) =>
  (richText(text) as ReactElement<{ href?: string; children?: string }>[]).filter((p) => isValidElement(p) && p.props.href).map((p) => p.props.children);
const plain = (text: string) =>
  (richText(text) as ReactElement<{ children?: string }>[]).map((p) => (isValidElement(p) ? p.props.children : p)).join('');

describe('richText', () => {
  it('does not turn the domain of an email into a mention', () => {
    expect(links('write to bartholomew.fitzgerald@northwind-industries-holdings.example.com')).toEqual([]);
  });
  it('still links real mentions and tags', () => {
    expect(links('thanks @kofimensah for #john6')).toEqual(['@kofimensah', '#john6']);
  });
  it('keeps one blank line between paragraphs at most', () => {
    expect(plain('one\n\n\n\n\ntwo')).toBe('one\n\ntwo');
    expect(plain('one\n\ntwo')).toBe('one\n\ntwo');
  });
});
