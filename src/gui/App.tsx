import classNames from 'classnames'
import React, { useState } from 'react'
import { Button, Col, Container, Row, Table } from 'reactstrap'
import slugify from 'slugify'
import { DATA, DataOutline, PullData, SpellData } from '../data/data'

const STORAGE_KEY = 'qbie-data-viewer'

type AppProps = {

}

export const App = (props: AppProps): JSX.Element | null => {

    const [state, setState] = useState<DataOutline | null>(() => {
        const data = localStorage.getItem(STORAGE_KEY)
        if (data) {
            try {
                return JSON.parse(data)
            } catch (error) {
                return null
            }
        }
    })

    return (
        <Container className="my-3">
            <Row className="mb-3">
                <Col className="d-flex align-items-center">
                    <Button onClick={() => {
                        const jsonData = prompt('import')
                        if (jsonData) {
                            localStorage.setItem(STORAGE_KEY, jsonData)
                            setState(JSON.parse(jsonData))
                        }

                    }}>
                        {"Import"}
                    </Button>
                    <span className="ms-2">{`Click on a row to show rows that are offset from it`}</span>
                </Col>
            </Row>
            {state && (
                <Row>
                    <Col xs="4">
                        <Navigation data={state} />
                    </Col>
                    <Col xs="8">
                        {Object.keys(DATA).map(entry => {
                            return (
                                <PlayerContainer name={entry} spellData={DATA[entry]} />
                            )
                        })}
                    </Col>
                </Row>
            )}
        </Container>
    )
}

type NavigationProps = {
    data: DataOutline
}

export const Navigation = (props: NavigationProps): JSX.Element | null => {

    const items = Object.keys(props.data).map(playerName => {
        return (
            <li>
                {playerName}
                <ul>
                    {Object.keys(props.data[playerName]).map(spellName => {
                        return (
                            <li>
                                <a href={`#${slugify(`${playerName}_${spellName}`)}`}>
                                    {spellName}
                                </a>
                            </li>
                        )
                    })}
                </ul>
            </li>
        )
    })

    return (
        <div >
            {"Navigation"}

            <ul>
                {items}
            </ul>
        </div>
    )
}

type PlayerContainerProps = {
    name: string
    spellData: SpellData
}

export const PlayerContainer = (props: PlayerContainerProps): JSX.Element | null => {

    return (
        <div>
            {Object.keys(props.spellData).map(entry => {

                return (
                    <SpellTable spell={entry} player={props.name} pullData={props.spellData[entry]} />
                )
            })}
        </div>
    )
}

type SpellTableProps = {
    player: string
    spell: string
    pullData: PullData[]
}

export const SpellTable = (props: SpellTableProps): JSX.Element | null => {

    const [state, setState] = useState<{
        targets: {
            [pull: string]: number[]
        }
    }>({
        targets: {
            [""]: [0]
        }
    })

    let maxCols = 0

    props.pullData.forEach(item => {
        Object.keys(item).forEach(entry => {
            const uses = item[entry]

            if (maxCols < uses.length) {
                maxCols = uses.length
            }
        })
    })

    const rowSelected = (item: string, values: number[]) => {
        setState({
            targets: {
                [item]: values
            }
        })
    }

    const getDiff = (target: number, value: number, minDelta: number) => {

        return Math.abs(target - value) > minDelta
    }

    return (
        <div id={slugify(`${props.player}_${props.spell}`)}>
            <b>{props.player}</b> - {props.spell}
            <div
                style={{
                    maxWidth: 650
                }}
                className="mt-2"
            >
                <Table size="sm" bordered responsive>
                    <thead>
                        <tr>
                            <th className="text-center">
                                {'#'}
                            </th>
                            {[...Array(maxCols)].map((_, i) =>
                                <th className="text-center">
                                    {`Use ${i + 1}`}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {props.pullData.map(item => {
                            return Object.keys(item).map(pullCount => {
                                return (
                                    <tr
                                        tabIndex={0}
                                        onClick={() => {
                                            rowSelected(pullCount, item[pullCount])
                                        }}
                                        className={classNames('text-center', {
                                            'bg-light': state.targets[pullCount] != null,
                                        })}
                                        style={{
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <th scope="row">
                                            {pullCount}
                                        </th>
                                        {[...Array(maxCols)].map((_, i) => {
                                            const data = item[pullCount][i]
                                            if (data == null) {
                                                return <td />
                                            }
                                            const doColorRow = state.targets[pullCount] == null
                                            const colorRed = getDiff(Object.values(state.targets)[0][i], data, 4500)
                                            return (
                                                <td className={classNames({
                                                    'text-danger': ((doColorRow && colorRed)
                                                    ),
                                                })}>
                                                    {Math.round(data / 1000)}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                )
                            })
                        })}
                    </tbody>
                </Table>
            </div>
        </div>
    )
}
