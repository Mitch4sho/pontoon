/* @flow */

import * as React from 'react';

import './Entity.css';

import { TranslationProxy } from 'core/translation';
import { Localized } from '@fluent/react';

import type { Entity as EntityType } from 'core/api';
import type { Locale } from 'core/locale';
import type { NavigationParams } from 'core/navigation';

type Props = {
    checkedForBatchEditing: boolean,
    toggleForBatchEditing: Function,
    entity: EntityType,
    isReadOnlyEditor: boolean,
    isTranslator: boolean,
    locale: Locale,
    selected: boolean,
    selectEntity: Function,
    getSiblingEntities: Function,
    siblings: boolean,
    parameters: NavigationParams,
};

/**
 * Displays a single Entity as a list element.
 *
 * The format of this element is: "[Status] Source (Translation)"
 *
 * "Status" is the current status of the translation. Can be:
 *   - "errors": one of the plural forms has errors and is approved or fuzzy
 *   - "warnings": one of the plural forms has warnings and is approved or fuzzy
 *   - "approved": all plural forms are approved and don't have errors or warnings
 *   - "fuzzy": all plural forms are fuzzy and don't have errors or warnings
 *   - "partial": some plural forms have either approved or fuzzy translations, but not all
 *   - "missing": none of the plural forms have an approved or fuzzy translation
 *
 * "Source" is the original string from the project. Usually it's the en-US string.
 *
 * "Translation" is the current "best" translation. It shows either the approved
 * translation, or the fuzzy translation, or the last suggested translation.
 */
export default class Entity extends React.Component<Props> {
    get status(): string {
        const translations = this.props.entity.translation;
        let approved = 0;
        let fuzzy = 0;
        let errors = 0;
        let warnings = 0;

        translations.forEach(function (translation) {
            if (
                translation.errors.length &&
                (translation.approved || translation.fuzzy)
            ) {
                errors++;
            } else if (
                translation.warnings.length &&
                (translation.approved || translation.fuzzy)
            ) {
                warnings++;
            } else if (translation.approved) {
                approved++;
            } else if (translation.fuzzy) {
                fuzzy++;
            }
        });

        if (errors) {
            return 'errors';
        }
        if (warnings) {
            return 'warnings';
        }
        if (approved === translations.length) {
            return 'approved';
        }
        if (fuzzy === translations.length) {
            return 'fuzzy';
        }
        if (approved > 0 || fuzzy > 0) {
            return 'partial';
        }
        return 'missing';
    }

    selectEntity: (e: SyntheticMouseEvent<HTMLLIElement>) => null | void = (
        e: SyntheticMouseEvent<HTMLLIElement>,
    ) => {
        // Flow requires that we use `e.currentTarget` instead of `e.target`.
        // However in this case, we do want to use that, so I'm ignoring all
        // errors Flow throws there.
        // $FlowIgnore
        if (e.target && e.target.classList.contains('status')) {
            return null;
        }

        this.props.selectEntity(this.props.entity);
    };

    getSiblingEntities: (e: SyntheticMouseEvent<HTMLButtonElement>) => void = (
        e: SyntheticMouseEvent<HTMLButtonElement>,
    ) => {
        e.stopPropagation();
        this.props.getSiblingEntities(this.props.entity.pk);
    };

    toggleForBatchEditing: (e: SyntheticMouseEvent<HTMLSpanElement>) => void = (
        e: SyntheticMouseEvent<HTMLSpanElement>,
    ) => {
        const { entity, isReadOnlyEditor, isTranslator } = this.props;

        if (isTranslator && !isReadOnlyEditor) {
            e.stopPropagation();
            this.props.toggleForBatchEditing(entity.pk, e.shiftKey);
        }
    };

    areFiltersApplied: () => boolean = () => {
        const parameters = this.props.parameters;
        if (
            parameters.status != null ||
            parameters.extra != null ||
            parameters.tag != null ||
            parameters.time != null ||
            parameters.author != null
        ) {
            return true;
        }
        return false;
    };

    render(): React.Element<'li'> {
        const {
            checkedForBatchEditing,
            entity,
            isReadOnlyEditor,
            isTranslator,
            locale,
            selected,
            siblings,
            parameters,
        } = this.props;

        const classSelected = selected ? 'selected' : '';

        const classBatchEditable =
            isTranslator && !isReadOnlyEditor ? 'batch-editable' : '';

        const classChecked = checkedForBatchEditing ? 'checked' : '';

        const classSiblings = siblings ? 'sibling' : '';
        return (
            <li
                className={`entity ${this.status} ${classSelected} ${classBatchEditable} ${classChecked} ${classSiblings}`}
                onClick={this.selectEntity}
            >
                <span
                    className='status fa'
                    onClick={this.toggleForBatchEditing}
                />
                {classSelected ? (
                    <div>
                        {parameters.search || this.areFiltersApplied() ? (
                            <Localized id='entitieslist-Entity--sibling-strings-title'>
                                <i
                                    className={
                                        'sibling-entities-icon fas fa-arrows-alt-v'
                                    }
                                    title='Click to reveal sibling strings'
                                    onClick={this.getSiblingEntities}
                                ></i>
                            </Localized>
                        ) : null}
                    </div>
                ) : null}
                <div>
                    <p className='source-string'>
                        <TranslationProxy
                            content={entity.original}
                            format={entity.format}
                            search={parameters.search}
                        />
                    </p>
                    <p
                        className='translation-string'
                        dir={locale.direction}
                        lang={locale.code}
                        data-script={locale.script}
                    >
                        <TranslationProxy
                            content={entity.translation[0].string}
                            format={entity.format}
                            search={parameters.search}
                        />
                    </p>
                </div>
            </li>
        );
    }
}
