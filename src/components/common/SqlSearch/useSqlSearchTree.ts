import type { Ref } from 'vue'
import type { SqlSearchNode, SqlSearchValue } from './types'
import {
  appendChildToGroup,
  createDefaultSqlSearchValue,
  createEmptyCondition,
  createEmptyGroup,
  patchNodeInTree,
  removeNodeFromTree,
  reorderGroupChildren,
  replaceNodeInTree,
  updateGroupChildAt,
} from './utils'

export function useSqlSearchTree(modelValue: Ref<SqlSearchValue | undefined>) {
  function getRoot(): SqlSearchValue {
    return modelValue.value ?? createDefaultSqlSearchValue()
  }

  function setRoot(value: SqlSearchValue) {
    modelValue.value = value
  }

  function patchNode(id: string, patch: Partial<SqlSearchNode>) {
    setRoot(patchNodeInTree(getRoot(), id, patch))
  }

  function replaceNode(id: string, node: SqlSearchNode) {
    setRoot(replaceNodeInTree(getRoot(), id, node))
  }

  function removeNode(id: string) {
    setRoot(removeNodeFromTree(getRoot(), id))
  }

  function appendChild(groupId: string, child: SqlSearchNode) {
    setRoot(appendChildToGroup(getRoot(), groupId, child))
  }

  function reorderChildren(groupId: string, children: SqlSearchNode[]) {
    setRoot(reorderGroupChildren(getRoot(), groupId, children))
  }

  function updateChild(groupId: string, index: number, child: SqlSearchNode) {
    setRoot(updateGroupChildAt(getRoot(), groupId, index, child))
  }

  function addCondition(groupId: string) {
    appendChild(groupId, createEmptyCondition())
  }

  function addGroup(groupId: string) {
    appendChild(groupId, createEmptyGroup(true))
  }

  return {
    getRoot,
    setRoot,
    patchNode,
    replaceNode,
    removeNode,
    appendChild,
    reorderChildren,
    updateChild,
    addCondition,
    addGroup,
  }
}

export type SqlSearchTreeApi = ReturnType<typeof useSqlSearchTree>
