import React from 'react'
import { GetServerSideProps, NextPage } from 'next'
import { useRouter } from 'next/router'
import { dehydrate, QueryClient, useQuery } from 'react-query'
import axios from 'axios'
import { PokemonData } from '../../shared/interfaces/pokemonData.interface'
import { PokemonType } from '../../shared/interfaces/pokemonType.interface'
import { Sprites } from '../../shared/interfaces/sprites.interface'
import MainImage from '../../components/MainImage'
import PokemonTypes from '../../components/PokemonTypes'
import SpriteImages from '../../components/SpriteImages'
import PokemonDetails from '../../components/PokemonDetails'
import { ThreeCircles } from 'react-loader-spinner'
import convToUppercase from '../../util/convToUppercase'
import styles from '../../styles/PokemonPage.module.css'

const getPokemon = async (name: string): Promise<PokemonData> => {
    const URL = `https://pokeapi.co/api/v2/pokemon/${name}`
    const { data } = await axios.get(URL)
    const image: string = data.sprites.other.dream_world.front_default || data.sprites.other['official-artwork'].front_default
    const pokeTypes: PokemonType[] = data.types.map((poke: { slot: Number, type: { name: string, url: string } }) => {
        return { slot: poke.slot, name: poke.type.name }
    })
    const id: number = data.id
    const pokemonName: string = convToUppercase(data.name)
    const weight: number = data.weight
    const height: number = data.height
    const sprites: Sprites = {
        front_default: data.sprites.front_default as string,
        back_default: data.sprites.back_default as string,
        front_shiny: data.sprites.front_shiny as string,
        back_shiny: data.sprites.back_shiny as string
    }
    return { pokemonName, image, pokeTypes, id, weight, height, sprites }
}

const PokemonPage: NextPage = () => {
    const router = useRouter();
    const pokemonName = router.query.name ? router.query.name as string : "";

    const { data, isLoading, isError } = useQuery(
        ['pokemon_main', pokemonName],
        () => getPokemon(pokemonName),
        { enabled: pokemonName.length > 0, }
    )

    if (isError) router.push('/')
    if (isLoading) return (
        <section className={styles.pokemon__card}>
            <ThreeCircles color="white" height={100} width={100} outerCircleColor='red' />
        </section>
    )

    return (
        <section className={styles.pokemon__card}>
            <h1 className={styles.pokemon__name}>{data?.pokemonName}</h1>
            <MainImage image={data?.image} />
            <PokemonTypes types={data?.pokeTypes} />
            <SpriteImages sprites={data?.sprites} />
            <PokemonDetails id={data?.id} weight={data?.weight} height={data?.height} />
        </section>
    )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const name = context.query?.name as string
    const queryClient = new QueryClient()
    await queryClient.prefetchQuery('pokemon_main', () => getPokemon(name))
    return {
        props: {
            dehydratedState: dehydrate(queryClient)
        }
    }
}



export default PokemonPage