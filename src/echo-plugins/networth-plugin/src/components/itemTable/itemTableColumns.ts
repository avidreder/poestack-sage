import { ColumnDef } from '@tanstack/react-table'
import { itemIcon, itemName, itemQuantity, itemTabs, itemValue } from '../Columns/Columns'
import { IPricedItem } from '../../interfaces/priced-item.interface'

export const itemTableColumns = (): ColumnDef<IPricedItem>[] => [
  itemIcon({
    accessorKey: 'icon',
    header: 'Icon'
  }),
  itemName({
    accessorKey: 'name',
    header: 'Name'
  }),
  itemTabs({
    accessorKey: 'tab',
    header: 'Tabs'
  }),
  itemQuantity({
    header: 'Quantity',
    accessorKey: 'stackSize'
  }),
  itemValue({
    accessorKey: 'calculated',
    header: 'Price'
  }),
  itemValue({
    accessorKey: 'total',
    header: 'Total value'
  }),
  itemValue({
    accessorKey: 'comulative',
    header: 'Cumulative',
    cumulative: true
  })
]
