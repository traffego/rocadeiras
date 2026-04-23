import { supabase } from '@/lib/supabase'

export const api = {
    // Customers
    customers: {
        list: async () => {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('name')
            if (error) throw error
            return data
        },
        create: async (customer) => {
            const { data, error } = await supabase
                .from('customers')
                .insert(customer)
                .select()
                .single()
            if (error) throw error
            return data
        },
        update: async (id, updates) => {
            const { data, error } = await supabase
                .from('customers')
                .update(updates)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return data
        },
        delete: async (id) => {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id)
            if (error) throw error
        }
    },

    // Technicians
    technicians: {
        list: async () => {
            const { data, error } = await supabase
                .from('technicians')
                .select('*')
                .order('name')
            if (error) throw error
            return data
        },
        create: async (tech) => {
            const { data, error } = await supabase
                .from('technicians')
                .insert(tech)
                .select()
                .single()
            if (error) throw error
            return data
        },
        update: async (id, updates) => {
            const { data, error } = await supabase
                .from('technicians')
                .update(updates)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return data
        },
        delete: async (id) => {
            const { error } = await supabase
                .from('technicians')
                .delete()
                .eq('id', id)
            if (error) throw error
        }
    },

    // Service Orders
    orders: {
        list: async () => {
            const { data, error } = await supabase
                .from('service_orders')
                .select(`
          *,
          customer:customers(name),
          technician:technicians(name),
          equipment_type_data:equipment_types(id, name, slug),
          equipment_model_data:models(id, name, brand:brands(id, name))
        `)
                .order('entry_date', { ascending: false })
            if (error) throw error
            return data
        },
        getById: async (id) => {
            const { data, error } = await supabase
                .from('service_orders')
                .select(`
          *,
          customer:customers(*),
          technician:technicians(*),
          files(*),
          equipment_type_data:equipment_types(id, name, slug),
          equipment_model_data:models(id, name, brand:brands(id, name))
        `)
                .eq('id', id)
                .single()
            if (error) throw error
            return data
        },
        create: async (order) => {
            const { data, error } = await supabase
                .from('service_orders')
                .insert(order)
                .select()
                .single()
            if (error) throw error
            return data
        },
        update: async (id, updates) => {
            const { data, error } = await supabase
                .from('service_orders')
                .update(updates)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return data
        }
    },

    // Files
    files: {
        create: async (fileData) => {
            const { data, error } = await supabase
                .from('files')
                .insert(fileData)
                .select()
                .single()
            if (error) throw error
            return data
        }
    },

    // Kanban Columns
    kanban: {
        list: async () => {
            const { data, error } = await supabase
                .from('kanban_columns')
                .select('*')
                .order('position')
            if (error) throw error
            return data
        },
        create: async (column) => {
            const { data, error } = await supabase
                .from('kanban_columns')
                .insert(column)
                .select()
                .single()
            if (error) throw error
            return data
        },
        update: async (slug, updates) => {
            const { data, error } = await supabase
                .from('kanban_columns')
                .update(updates)
                .eq('slug', slug)
                .select()
                .single()
            if (error) throw error
            return data
        },
        delete: async (slug) => {
            const { error } = await supabase
                .from('kanban_columns')
                .delete()
                .eq('slug', slug)
            if (error) throw error
        }
    },
    // Parts Catalog
    parts: {
        list: async () => {
            const { data, error } = await supabase
                .from('parts')
                .select('*')
                .order('description')
            if (error) throw error
            return data
        },
        create: async (part) => {
            const { data, error } = await supabase
                .from('parts')
                .insert(part)
                .select()
                .single()
            if (error) throw error
            return data
        },
        update: async (id, updates) => {
            const { data, error } = await supabase
                .from('parts')
                .update(updates)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return data
        },
        delete: async (id) => {
            const { error } = await supabase
                .from('parts')
                .delete()
                .eq('id', id)
            if (error) throw error
        }
    },
    // Budgets
    budgets: {
        getById: async (id) => {
            const { data, error } = await supabase
                .from('budgets')
                .select(`
                    *,
                    items:budget_items(*)
                `)
                .eq('id', id)
                .single()
            if (error) throw error
            return data
        },
        getByOrderId: async (orderId) => {
            const { data, error } = await supabase
                .from('budgets')
                .select(`
                    *,
                    items:budget_items(*)
                `)
                .eq('service_order_id', orderId)
                .maybeSingle()
            if (error) throw error
            return data
        },
        create: async (budget) => {
            const { data, error } = await supabase
                .from('budgets')
                .insert(budget)
                .select()
                .single()
            if (error) throw error
            return data
        },
        update: async (id, updates) => {
            const { data, error } = await supabase
                .from('budgets')
                .update(updates)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return data
        },
        addItem: async (item) => {
            const { data, error } = await supabase
                .from('budget_items')
                .insert(item)
                .select()
                .single()
            if (error) throw error
            return data
        },
        updateItem: async (id, updates) => {
            const { data, error } = await supabase
                .from('budget_items')
                .update(updates)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return data
        },
        removeItem: async (id) => {
            const { error } = await supabase
                .from('budget_items')
                .delete()
                .eq('id', id)
            if (error) throw error
        }
    },

    // Equipment Models
    equipments: {
        list: async () => {
            const { data, error } = await supabase
                .from('equipment_models')
                .select('*, brand:brands(id, name), equipment_type:equipment_types(id, name, slug), model_data:models(id, name)')
                .order('created_at', { ascending: false })
            if (error) throw error
            return data
        },
        create: async (equipment) => {
            const { data, error } = await supabase
                .from('equipment_models')
                .insert(equipment)
                .select('*, brand:brands(id, name), equipment_type:equipment_types(id, name, slug), model_data:models(id, name)')
                .single()
            if (error) throw error
            return data
        },
        update: async (id, updates) => {
            const { data, error } = await supabase
                .from('equipment_models')
                .update(updates)
                .eq('id', id)
                .select('*, brand:brands(id, name), equipment_type:equipment_types(id, name, slug), model_data:models(id, name)')
                .single()
            if (error) throw error
            return data
        },
        delete: async (id) => {
            const { error } = await supabase
                .from('equipment_models')
                .delete()
                .eq('id', id)
            if (error) throw error
        },
        bulkUpdate: async (ids, updates) => {
            const { error } = await supabase
                .from('equipment_models')
                .update(updates)
                .in('id', ids)
            if (error) throw error
        },
        bulkDelete: async (ids) => {
            const { error } = await supabase
                .from('equipment_models')
                .delete()
                .in('id', ids)
            if (error) throw error
        }
    },

    // Equipment Types
    equipmentTypes: {
        list: async () => {
            const { data, error } = await supabase
                .from('equipment_types')
                .select('*')
                .order('name')
            if (error) throw error
            return data
        },
        create: async (type) => {
            const { data, error } = await supabase
                .from('equipment_types')
                .insert(type)
                .select()
                .single()
            if (error) throw error
            return data
        },
        update: async (id, updates) => {
            const { data, error } = await supabase
                .from('equipment_types')
                .update(updates)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return data
        },
        delete: async (id) => {
            const { error } = await supabase
                .from('equipment_types')
                .delete()
                .eq('id', id)
            if (error) throw error
        }
    },

    // Brands
    brands: {
        list: async () => {
            const { data, error } = await supabase
                .from('brands')
                .select('*')
                .order('name')
            if (error) throw error
            return data
        },
        create: async (brand) => {
            const { data, error } = await supabase
                .from('brands')
                .insert(brand)
                .select()
                .single()
            if (error) throw error
            return data
        },
        update: async (id, updates) => {
            const { data, error } = await supabase
                .from('brands')
                .update(updates)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return data
        },
        delete: async (id) => {
            const { error } = await supabase
                .from('brands')
                .delete()
                .eq('id', id)
            if (error) throw error
        }
    },

    // Models
    models: {
        list: async () => {
            const { data, error } = await supabase
                .from('models')
                .select('*, brand:brands(id, name)')
                .order('name')
            if (error) throw error
            return data
        },
        create: async (model) => {
            const { data, error } = await supabase
                .from('models')
                .insert(model)
                .select('*, brand:brands(id, name)')
                .single()
            if (error) throw error
            return data
        },
        update: async (id, updates) => {
            const { data, error } = await supabase
                .from('models')
                .update(updates)
                .eq('id', id)
                .select('*, brand:brands(id, name)')
                .single()
            if (error) throw error
            return data
        },
        delete: async (id) => {
            const { error } = await supabase
                .from('models')
                .delete()
                .eq('id', id)
            if (error) throw error
        }
    }
}
