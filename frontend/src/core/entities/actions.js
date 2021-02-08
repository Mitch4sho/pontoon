/* @flow */

import api from 'core/api';
import * as stats from 'core/stats';

import type { Entities, EntityTranslation, EntitySiblings } from 'core/api';

export const RECEIVE: 'entities/RECEIVE' = 'entities/RECEIVE';
export const REQUEST: 'entities/REQUEST' = 'entities/REQUEST';
export const RESET: 'entities/RESET' = 'entities/RESET';
export const UPDATE: 'entities/UPDATE' = 'entities/UPDATE';
export const RECEIVE_SIBLINGS: 'entities/RECEIVE_SIBLINGS' =
    'entities/RECEIVE_SIBLINGS';

/**
 * Indicate that entities are currently being fetched.
 */
export type RequestAction = {
    type: typeof REQUEST,
};
export function request(): RequestAction {
    return {
        type: REQUEST,
    };
}

/**
 * Update entities to a new set.
 */
export type ReceiveAction = {
    type: typeof RECEIVE,
    entities: Entities,
    hasMore: boolean,
};
export function receive(entities: Entities, hasMore: boolean): ReceiveAction {
    return {
        type: RECEIVE,
        entities,
        hasMore,
    };
}
/**
 * Update the siblings of an entity.
 */
export type ReceiveSiblingsAction = {
    type: typeof RECEIVE_SIBLINGS,
    siblings: EntitySiblings,
    entity: number,
};
export function receiveSiblings(
    siblings: EntitySiblings,
    entity: number,
): ReceiveSiblingsAction {
    return {
        type: RECEIVE_SIBLINGS,
        siblings,
        entity,
    };
}

/**
 * Update the active translation of an entity.
 */
export type UpdateAction = {
    type: typeof UPDATE,
    entity: number,
    pluralForm: number,
    translation: EntityTranslation,
};
export function updateEntityTranslation(
    entity: number,
    pluralForm: number,
    translation: EntityTranslation,
): UpdateAction {
    return {
        type: UPDATE,
        entity,
        pluralForm,
        translation,
    };
}

/**
 * Fetch entities and their translation.
 */
export function get(
    locale: string,
    project: string,
    resource: string,
    entityIds: ?Array<number>,
    exclude: Array<number>,
    entity: ?string,
    search: ?string,
    status: ?string,
    extra: ?string,
    tag: ?string,
    author: ?string,
    time: ?string,
): Function {
    return async (dispatch) => {
        dispatch(request());

        const content = await api.entity.getEntities(
            locale,
            project,
            resource,
            entityIds,
            exclude,
            entity,
            search,
            status,
            extra,
            tag,
            author,
            time,
            false,
        );

        if (content.entities) {
            dispatch(receive(content.entities, content.has_next));
            dispatch(stats.actions.update(content.stats));
        }
    };
}

export function getSiblingEntities(
    entity: number,
    locale: string,
    entityIds: Array<number>,
): Function {
    return async (dispatch) => {
        const siblings = await api.entity.getSiblingEntities(entity, locale);
        const preceding = siblings.preceding;
        const succeeding = siblings.succeeding;
        const precedingSiblings = [];
        const succeedingSiblings = [];

        // check if siblings are in the the list
        entityIds.forEach((id) => {
            const check = preceding.every((item) => item.pk !== id);
            const check2 = succeeding.every((item) => item.pk !== id);

            if (check && check2) {
                // dispatch siblings
            }
        });
        

        //if siblings are not in the list replace those that need to be replace
        
        // replace preceding
        preceding.forEach((item) => {
            const check = entityIds.every((id) => id !== item.pk);
            if (check) {
                precedingSiblings.push(item);
            }
        });

        //replace succeeding
        succeeding.forEach((item) => {
            const check = entityIds.every((id) => id !== item.pk);
            if (check) {
                succeedingSiblings.push(item);
            }
        });

        if (siblings) {
            dispatch(receiveSiblings(siblings, entity));
        }
    };
}

export type ResetAction = {
    type: typeof RESET,
};
export function reset(): ResetAction {
    return {
        type: RESET,
    };
}

export default {
    get,
    getSiblingEntities,
    receive,
    request,
    reset,
    receiveSiblings,
    updateEntityTranslation,
};
