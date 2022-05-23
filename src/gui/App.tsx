import classNames from 'classnames'
import React, { useState } from 'react'
import { Button, Col, Container, Input, Label, Row, Table } from 'reactstrap'
import slugify from 'slugify'
import { DataOutline, PullData, SpellData } from '../data/data'

const STORAGE_KEY = 'qbie-data-viewer'

type AppProps = {}

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

    const takeEntry = (state: DataOutline, player: string, spell: string): SpellData => {
        return {
            [spell]: state[player][spell]
        }
    }

    const [margin, setMargin] = useState<number>(5000)

    const [selected, setSelected] = useState<{
        player: string,
        spell: string
    }>(() => {

        if (state) {
            const [playerName, spellObj] = Object.entries(state)[0]
            const [spellName] = Object.entries(spellObj)[0]

            return {
                player: playerName,
                spell: spellName
            }
        }

        return {
            player: "",
            spell: ""
        }
    })

    return (
        <Container className="my-3">
            <Row className="mb-3">
                <Col>
                    <div className="d-flex justify-content-between align-items-end border bg-light p-3">
                        <div className="d-flex align-items-end gap-3 justify-content-start">
                            <div>
                                <Label className="mb-1 p-0" size="sm">{"Drift (milli)"}</Label>
                                <Input type="number" value={margin} style={{ width: 150 }} onChange={(ev) => {
                                    setMargin(parseInt(ev.target.value))
                                }} />
                            </div>
                            <span>{`Click on a row to show rows that are offset from it`}</span>
                        </div>
                        <Button onClick={() => {
                            const jsonData = prompt('import')
                            if (jsonData) {
                                localStorage.setItem(STORAGE_KEY, jsonData)
                                setState(JSON.parse(jsonData))
                            }
                        }}>
                            {"Import"}
                        </Button>
                    </div>
                </Col>
            </Row>
            {state && (
                <Row>
                    <Col xs="4">
                        <Navigation
                            data={state}
                            selected={selected}
                            onSelect={(player, spell) => {
                                setSelected({ player, spell })
                            }}
                        />
                    </Col>
                    <Col xs="8">
                        <PlayerContainer
                            margin={margin}
                            name={selected.player}
                            spellData={takeEntry(state, selected.player, selected.spell)}
                        />
                    </Col>
                </Row>
            )}
        </Container>
    )
}

type NavigationProps = {
    data: DataOutline
    selected: {
        player: string,
        spell: string
    }
    onSelect: (player: string, spell: string) => void
}

export const Navigation = (props: NavigationProps): JSX.Element | null => {

    const items = Object.keys(props.data).map(playerName => {
        return (
            <li key={playerName}>
                {playerName}
                <ul>
                    {Object.keys(props.data[playerName]).map(spellName => {
                        return (
                            <li
                                key={spellName}
                                className={classNames({
                                    'fw-bold': (props.selected.player == playerName && props.selected.spell == spellName)
                                })}
                            >
                                <a
                                    style={{ cursor: 'pointer' }}
                                    className="link"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        props.onSelect(playerName, spellName)
                                    }}
                                >
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
        <div>
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
    margin: number
}

export const PlayerContainer = (props: PlayerContainerProps): JSX.Element | null => {

    return (
        <div>
            {Object.keys(props.spellData).map(entry => {
                return (
                    <SpellTable
                        key={`${entry}_${props.name}`}
                        spell={entry}
                        player={props.name}
                        pullData={props.spellData[entry]}
                        margin={props.margin} />
                )
            })}
        </div>
    )
}

type SpellTableProps = {
    player: string
    spell: string
    pullData: PullData[]
    margin: number
}

export const SpellTable = (props: SpellTableProps): JSX.Element | null => {

    const [state, setState] = useState<{
        targets: {
            [pull: string]: number[]
        }
    }>(() => {

        const d = props.pullData[0]
        const [key, value] = Object.entries(d)[0]

        return {
            targets: {
                [key]: value
            }
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
                <Table size="sm" bordered style={{ width: 'auto' }}>
                    <thead>
                        <tr>
                            <th className="text-center">
                                {'#'}
                            </th>
                            {[...Array(maxCols)].map((_, i) =>
                                <th
                                    key={i}
                                    className="text-center"
                                >
                                    {`Use ${i + 1}`}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {props.pullData.flatMap(item => {
                            return Object.keys(item).map((pullCount) => {
                                return (
                                    <tr
                                        key={pullCount}
                                        tabIndex={0}
                                        onClick={() => {
                                            rowSelected(pullCount, item[pullCount])
                                        }}
                                        className={classNames('text-center', {
                                            'bg-dark': state.targets[pullCount] != null,
                                            'text-white': state.targets[pullCount] != null,
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
                                                return <td key={i} />
                                            }
                                            const doColorRow = state.targets[pullCount] == null
                                            const colorRed = getDiff(Object.values(state.targets)[0][i], data, props.margin)
                                            return (
                                                <td
                                                    key={i}
                                                    className={classNames({
                                                        'text-black': (doColorRow && colorRed),
                                                        'bg-danger': (doColorRow && colorRed),
                                                    })
                                                    }
                                                >
                                                    {secondsToTimestamp(Math.round(data / 1000))}
                                                </td>
                                            )
                                        })
                                        }
                                    </tr>
                                )
                            })
                        })}
                    </tbody>
                </Table>
            </div>
        </div >
    )
}

function secondsToTimestamp(seconds: number): string {
    if (seconds < 0) {
        throw Error(`Seconds cannot be a negative number: ${seconds}`)
    }

    return new Date(seconds * 1000).toISOString().substr(14, 5)
}
